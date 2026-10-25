"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import {
  allocateDatedOperationsSeat,
  assertPaidPeriodCapacity,
} from "@/lib/delivery-capacity"
import {
  addUtcDays,
  expectedDatesForPlacement,
  paidPeriodSummary,
  sessionFromPlacement,
  sortPaidPeriodSessions,
  type AcademyClosure,
  type PaidPeriodPlacement,
  type PaidPeriodSession,
} from "@/lib/paid-period"
import { supabaseService } from "@/lib/supabase/service"

const schema = z.object({
  learnerId: z.string().uuid(),
  scope: z.enum(["from_date", "single_session"]),
  effectiveDate: z.string().date(),
  replacementDate: z.string().date().optional(),
  templateId: z.string().uuid(),
  pricePlanId: z.string().uuid(),
  reason: z.string().trim().max(300).optional(),
  confirmChange: z.literal("yes"),
})

type AccountAdjustment = {
  id: string
  entryType: "session_change_credit" | "session_change_charge" | "session_change_no_balance"
  amountCents: number
  originatingLearnerId: string
  originatingLearnerName: string
  effectiveDate: string
  scope: "from_date" | "single_session"
  oldValueCents: number
  newValueCents: number
  oldSessions: PaidPeriodSession[]
  newSessions: PaidPeriodSession[]
  reason: string | null
  createdBy: string
  createdAt: string
}

function parsePaidSessions(value: unknown): PaidPeriodSession[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is PaidPeriodSession =>
      Boolean(
        item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          typeof (item as Record<string, unknown>).date === "string" &&
          typeof (item as Record<string, unknown>).priceCents === "number",
      ),
  )
}

function parseAdjustments(value: unknown): AccountAdjustment[] {
  return Array.isArray(value) ? (value as AccountAdjustment[]) : []
}

function sameLearner(session: PaidPeriodSession, learnerId: string) {
  return session.learnerId === learnerId
}

export async function changeFutureSessions(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = schema.safeParse({
    learnerId: formData.get("learnerId"),
    scope: formData.get("scope"),
    effectiveDate: formData.get("effectiveDate"),
    replacementDate: formData.get("replacementDate") || undefined,
    templateId: formData.get("templateId"),
    pricePlanId: formData.get("pricePlanId"),
    reason: formData.get("reason") || undefined,
    confirmChange: formData.get("confirmChange"),
  })
  if (!parsed.success) throw new Error("Check the future-session change details")

  const data = parsed.data
  const today = new Date().toISOString().slice(0, 10)
  if (data.effectiveDate < today) {
    throw new Error("Past sessions cannot be changed")
  }

  const supabase = supabaseService()
  const { data: learner, error: learnerError } = await supabase
    .from("learners")
    .select("id,first_name,parent_lead_id,child_lead_id,status")
    .eq("id", data.learnerId)
    .single()
  if (learnerError || !learner || learner.status !== "active" || !learner.parent_lead_id) {
    throw new Error("This learner is not available for a future-session change")
  }

  const [
    { data: entitlement, error: entitlementError },
    { data: template, error: templateError },
    { data: plan, error: planError },
    { data: parent, error: parentError },
  ] = await Promise.all([
    supabase
      .from("child_payment_entitlements")
      .select("id,payment_entitlement_id,period_start,period_end,selected_sessions,status")
      .eq("learner_id", learner.id)
      .eq("status", "paid")
      .gte("period_end", data.effectiveDate)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("weekly_table_templates")
      .select("id,weekday,table_number,academy_table_id,starts_at,duration_minutes,teacher_name,focus,status")
      .eq("id", data.templateId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("session_price_plans")
      .select("id,name,price_cents,status")
      .eq("id", data.pricePlanId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("parent_leads")
      .select("id,account_adjustments")
      .eq("id", learner.parent_lead_id)
      .maybeSingle(),
  ])

  if (entitlementError || !entitlement) throw new Error("No current paid period covers this change")
  if (templateError || !template) throw new Error("The destination timetable session is no longer available")
  if (planError || !plan) throw new Error("The selected session rate is no longer available")
  if (parentError || !parent) throw new Error("The family account could not be loaded")

  const allLearnerSessions = parsePaidSessions(entitlement.selected_sessions).filter((session) =>
    sameLearner(session, learner.id),
  )
  if (!allLearnerSessions.length) throw new Error("This paid period has no exact dated sessions to change")

  const oldSessions =
    data.scope === "single_session"
      ? allLearnerSessions.filter((session) => session.date === data.effectiveDate)
      : allLearnerSessions.filter((session) => session.date >= data.effectiveDate)

  if (!oldSessions.length) throw new Error("No future paid sessions start on or after that date")

  const affectedDates = [...new Set(oldSessions.map((session) => session.date))]
  const { data: attendance, error: attendanceError } = await supabase
    .from("attendance_records")
    .select("attendance_date,status")
    .eq("learner_id", learner.id)
    .in("attendance_date", affectedDates)
  if (attendanceError) throw new Error("Attendance history could not be checked")
  if ((attendance || []).length) {
    throw new Error("A session with attendance already recorded cannot be repriced or moved")
  }

  const { data: closures, error: closureError } = await supabase
    .from("academy_closures")
    .select("starts_on,ends_on,reason")
    .lte("starts_on", entitlement.period_end)
    .gte("ends_on", data.effectiveDate)
  if (closureError) throw new Error("Academy closure dates could not be checked")
  const academyClosures: AcademyClosure[] = (closures || []).map((item) => ({
    startsOn: item.starts_on,
    endsOn: item.ends_on,
    reason: item.reason,
  }))

  const oldPlacementIds = [...new Set(oldSessions.map((session) => session.placementId))]
  const { data: oldPlacements, error: oldPlacementError } = await supabase
    .from("standing_placements")
    .select("id,weekday,table_number,academy_table_id,seat_number,starts_at,duration_minutes,teacher_name,focus,effective_from,effective_to,status")
    .in("id", oldPlacementIds)
  if (oldPlacementError || !oldPlacements?.length) {
    throw new Error("The learner's recurring place could not be loaded")
  }

  const previewPlacement: PaidPeriodPlacement = {
    placementId: oldSessions[0].placementId,
    learnerId: learner.id,
    learnerName: learner.first_name,
    childLeadId: learner.child_lead_id,
    weekday: template.weekday,
    academyTableId: template.academy_table_id,
    tableNumber: template.table_number,
    seatNumber: null,
    startsAt: String(template.starts_at).slice(0, 5),
    durationMinutes: template.duration_minutes,
    teacherName: template.teacher_name,
    focus: template.focus,
    pricePlanId: plan.id,
    pricePlanName: plan.name,
    priceCents: plan.price_cents,
  }

  let destinationDates: string[]
  if (data.scope === "single_session") {
    if (!data.replacementDate) throw new Error("Choose the replacement date")
    if (data.replacementDate < today || data.replacementDate > entitlement.period_end) {
      throw new Error("The replacement date must be within the current paid period")
    }
    if (new Date(data.replacementDate + "T12:00:00Z").getUTCDay() !== template.weekday) {
      throw new Error("The replacement date does not match the selected timetable day")
    }
    const blocked = academyClosures.find(
      (item) => item.startsOn <= data.replacementDate! && item.endsOn >= data.replacementDate!,
    )
    if (blocked) throw new Error("The replacement date falls on an Academy closure")
    destinationDates = [data.replacementDate]
  } else {
    destinationDates = expectedDatesForPlacement(
      previewPlacement,
      data.effectiveDate,
      entitlement.period_end,
      academyClosures,
    )
  }

  if (!destinationDates.length) throw new Error("The selected timetable creates no replacement sessions in this paid period")

  let candidateSessions = destinationDates.map((date) =>
    sessionFromPlacement(previewPlacement, date, data.scope === "single_session"),
  )
  await assertPaidPeriodCapacity(candidateSessions, supabase)

  let newPlacementId = oldSessions[0].placementId
  if (data.scope === "from_date") {
    const endOldOn = addUtcDays(data.effectiveDate, -1)
    const { error: closeError } = await supabase
      .from("standing_placements")
      .update({ effective_to: endOldOn, updated_by: user.id })
      .in("id", oldPlacementIds)
      .eq("status", "active")
    if (closeError) throw new Error("The existing recurring place could not be end-dated")

    const { data: newPlacement, error: newPlacementError } = await supabase
      .from("standing_placements")
      .insert({
        learner_id: learner.id,
        weekday: template.weekday,
        table_number: template.table_number,
        academy_table_id: template.academy_table_id,
        seat_number: null,
        starts_at: template.starts_at,
        duration_minutes: template.duration_minutes,
        teacher_name: template.teacher_name,
        focus: template.focus,
        effective_from: data.effectiveDate,
        status: "active",
        room_code: "TAA1",
        session_price_plan_id: plan.id,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single()
    if (newPlacementError || !newPlacement) {
      throw new Error("The new recurring place could not be created")
    }
    newPlacementId = newPlacement.id
    candidateSessions = candidateSessions.map((session) => ({
      ...session,
      placementId: newPlacement.id,
    }))
  }

  for (const oldSession of oldSessions) {
    const { data: delivery } = await supabase
      .from("delivery_sessions")
      .select("id")
      .eq("service_date", oldSession.date)
      .eq("academy_table_id", oldSession.academyTableId)
      .eq("starts_at", oldSession.startsAt)
      .maybeSingle()
    if (!delivery) continue
    const { error } = await supabase
      .from("delivery_seats")
      .update({
        status: "cancelled",
        note: "Moved by admin as part of a prepaid session change",
        updated_by: user.id,
      })
      .eq("delivery_session_id", delivery.id)
      .eq("learner_id", learner.id)
      .in("status", ["scheduled", "payment_pending"])
    if (error) throw new Error("An existing Operations place could not be moved")
  }

  const allocatedSessions: PaidPeriodSession[] = []
  for (const session of candidateSessions) {
    const seatNumber = await allocateDatedOperationsSeat({
      session,
      learnerId: learner.id,
      userId: user.id,
      status: "scheduled",
      note: "Changed prepaid session",
      supabase,
    })
    allocatedSessions.push({ ...session, seatNumber })
  }

  if (data.scope === "from_date") {
    const preferredSeat = allocatedSessions[0]?.seatNumber ?? null
    if (preferredSeat) {
      await supabase
        .from("standing_placements")
        .update({ seat_number: preferredSeat, updated_by: user.id })
        .eq("id", newPlacementId)
    }

    const { data: activeBookings } = await supabase
      .from("accepted_bookings")
      .select("id")
      .eq("learner_id", learner.id)
      .in("status", ["paid_active", "contacted", "accepted_awaiting_payment"])
      .order("created_at")
    if (activeBookings?.length) {
      const [first, ...rest] = activeBookings
      await supabase
        .from("accepted_bookings")
        .update({
          weekly_table_template_id: template.id,
          session_price_plan_id: plan.id,
          weekday: template.weekday,
          table_number: template.table_number,
          academy_table_id: template.academy_table_id,
          seat_number: preferredSeat || 1,
          starts_at: template.starts_at,
          duration_minutes: template.duration_minutes,
          status: "paid_active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", first.id)
      if (rest.length) {
        await supabase
          .from("accepted_bookings")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .in("id", rest.map((item) => item.id))
      }
    }
  }

  const unaffectedLearnerSessions = allLearnerSessions.filter(
    (session) => !oldSessions.some(
      (old) =>
        old.date === session.date &&
        old.startsAt === session.startsAt &&
        old.placementId === session.placementId,
    ),
  )
  const finalLearnerSessions = sortPaidPeriodSessions([
    ...unaffectedLearnerSessions,
    ...allocatedSessions,
  ])
  const learnerSummary = paidPeriodSummary(finalLearnerSessions)
  const { error: childUpdateError } = await supabase
    .from("child_payment_entitlements")
    .update({
      selected_sessions: finalLearnerSessions,
      selected_session_count: finalLearnerSessions.length,
      period_start: learnerSummary.periodStart,
      period_end: learnerSummary.periodEnd,
      note: "Paid period adjusted by admin; see family account adjustment history",
    })
    .eq("id", entitlement.id)
  if (childUpdateError) throw new Error("The learner's paid-session audit could not be updated")

  const { data: familyPayment, error: familyPaymentError } = await supabase
    .from("payment_entitlements")
    .select("id,selected_sessions")
    .eq("id", entitlement.payment_entitlement_id)
    .single()
  if (familyPaymentError || !familyPayment) {
    throw new Error("The family payment record could not be loaded")
  }
  const familySessions = parsePaidSessions(familyPayment.selected_sessions)
  const otherFamilySessions = familySessions.filter((session) => !sameLearner(session, learner.id))
  const finalFamilySessions = sortPaidPeriodSessions([
    ...otherFamilySessions,
    ...finalLearnerSessions,
  ])
  const { error: familyPaymentUpdateError } = await supabase
    .from("payment_entitlements")
    .update({
      selected_sessions: finalFamilySessions,
      selected_session_count: finalFamilySessions.length,
    })
    .eq("id", familyPayment.id)
  if (familyPaymentUpdateError) {
    throw new Error("The family payment session audit could not be updated")
  }

  const oldValueCents = oldSessions.reduce((total, session) => total + session.priceCents, 0)
  const newValueCents = allocatedSessions.reduce((total, session) => total + session.priceCents, 0)
  const differenceCents = newValueCents - oldValueCents
  const entry: AccountAdjustment = {
    id: randomUUID(),
    entryType:
      differenceCents < 0
        ? "session_change_credit"
        : differenceCents > 0
          ? "session_change_charge"
          : "session_change_no_balance",
    amountCents: differenceCents,
    originatingLearnerId: learner.id,
    originatingLearnerName: learner.first_name,
    effectiveDate: data.effectiveDate,
    scope: data.scope,
    oldValueCents,
    newValueCents,
    oldSessions,
    newSessions: allocatedSessions,
    reason: data.reason || null,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }
  const adjustments = parseAdjustments(parent.account_adjustments)
  const { error: adjustmentError } = await supabase
    .from("parent_leads")
    .update({ account_adjustments: [...adjustments, entry] })
    .eq("id", parent.id)
  if (adjustmentError) {
    throw new Error("The sessions changed, but the family balance audit could not be recorded")
  }

  revalidatePath("/admin/leads")
  revalidatePath("/admin/operations")
  revalidatePath("/admin/payments")
  revalidatePath("/admin/renewals")
  revalidatePath("/admin/learners/" + learner.id)
}
