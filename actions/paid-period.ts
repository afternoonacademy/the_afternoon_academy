"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { writeFamilyPaidSessions } from "@/lib/admin/write-family-paid-sessions"
import { withRenewalOfferLock } from "@/lib/admin/renewal-offer-lock"
import { RenewalDateError, renewalDateKey, resolveRenewalDate } from "@/lib/admin/renewal-dated-sessions.mjs"
import { renewalOfferChanged } from "@/lib/admin/renewal-offer-revisions.mjs"
import { MAX_SESSION_PRICE_CENTS } from "@/lib/dated-session-pricing.mjs"
import { withFamilyBookingLock } from "@/lib/admin/family-booking-lock"
import { requireAdmin } from "@/lib/auth/require-admin"
import { paymentEligibleBookingStatuses } from "@/lib/admin/lead-planning-lifecycle.mjs"
import { renderRenewalEmail } from "@/lib/email/renewal-email"
import { allocateDatedOperationsSeat, assertPaidPeriodCapacity } from "@/lib/delivery-capacity"
import {
  paidPeriodSummary,
  sortPaidPeriodSessions,
  type PaidPeriodSession,
} from "@/lib/paid-period"
import { supabaseService } from "@/lib/supabase/service"

const selectedSessionSchema = z.object({
  learnerId: z.string().uuid().nullable(),
  learnerName: z.string().trim().min(1).max(80),
  childLeadId: z.string().uuid().nullable().optional(),
  placementId: z.string().min(1).max(100),
  date: z.string().date(),
  academyTableId: z.string().uuid(),
  tableNumber: z.coerce.number().int().min(1).max(40),
  seatNumber: z.number().int().min(1).max(40).nullable(),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  actualStartsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  timeTbc: z.boolean().optional(),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  teacherName: z.string().trim().max(160).nullable(),
  focus: z.string().trim().max(500).nullable(),
  pricePlanId: z.string().uuid(),
  pricePlanName: z.string().trim().min(1).max(160),
  priceCents: z.number().int().min(0).max(MAX_SESSION_PRICE_CENTS),
  replacement: z.boolean(),
  sessionOrigin: z
    .enum(["recurring", "pre_agreed_exception", "replacement"])
    .optional(),
})

const manualSchema = z.object({
  parentLeadId: z.string().uuid(),
  childLeadId: z.string().uuid(),
  receivedOn: z.string().date(),
  paymentReceived: z.literal("yes"),
  selectedSessions: z.string().min(2),
})

const renewalSchema = z.object({
  caseId: z.string().uuid(),
  parentLeadId: z.string().uuid(),
  selectedSessions: z.string().min(2),
})

const renewalDraftSchema = renewalSchema.extend({
  offerRevision: z.coerce.number().int().nonnegative(),
})

const renewalPaymentSchema = renewalSchema.extend({
  receivedOn: z.string().date(),
  bankReference: z.string().trim().max(160).optional(),
  note: z.string().trim().max(300).optional(),
})

export type ExactManualEnrolmentState = { error?: string; success?: string }

function parseSessions(raw: string): PaidPeriodSession[] {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error("The selected service dates could not be read")
  }
  const parsed = z.array(selectedSessionSchema).min(1).max(366).safeParse(value)
  if (!parsed.success) throw new Error("Choose at least one valid paid service date")
  const unique = new Set<string>()
  const learnerAllocations = new Set<string>()
  for (const session of parsed.data) {
    const key = `${session.placementId}|${session.date}|${session.startsAt}`
    if (unique.has(key)) throw new Error("A service date is selected more than once")
    unique.add(key)

    if (session.learnerId) {
      const learnerKey = `${session.learnerId}|${session.date}|${session.academyTableId}|${session.startsAt}`
      if (learnerAllocations.has(learnerKey)) {
        throw new Error(`${session.learnerName} is selected more than once for the same dated session`)
      }
      learnerAllocations.add(learnerKey)
    }
  }
  return sortPaidPeriodSessions(parsed.data)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00Z`))
}

async function assertDatesOpen(
  sessions: PaidPeriodSession[],
  supabase: ReturnType<typeof supabaseService>,
) {
  const summary = paidPeriodSummary(sessions)
  if (!summary.periodStart || !summary.periodEnd) throw new Error("Choose at least one service date")
  const { data: closures, error } = await supabase
    .from("academy_closures")
    .select("starts_on,ends_on,reason")
    .lte("starts_on", summary.periodEnd)
    .gte("ends_on", summary.periodStart)
  if (error) throw new Error("Could not check Academy closure dates")
  for (const session of sessions) {
    const closure = (closures || []).find(
      (item) => item.starts_on <= session.date && item.ends_on >= session.date,
    )
    if (closure) {
      throw new Error(
        `${formatDate(session.date)} is closed: ${closure.reason}. Change the closure in Academy Setup if the Academy is opening.`,
      )
    }
  }
}

async function createDatedOperationsSeats(
  sessions: PaidPeriodSession[],
  learnerId: string,
  userId: string,
  supabase: ReturnType<typeof supabaseService>,
) {
  const allocated: PaidPeriodSession[] = []

  for (const session of sessions) {
    const seatNumber = await allocateDatedOperationsSeat({
      session,
      learnerId,
      userId,
      status: "scheduled",
      note: session.replacement ? "Paid replacement session" : null,
      supabase,
    })
    // The paid seat remains attached to its standing time. A one-off teaching
    // time belongs to the individual seat, never to the Academy-wide session.
    if (session.actualStartsAt || session.timeTbc) {
      const { data: delivery, error: deliveryError } = await supabase
        .from("delivery_sessions")
        .select("id")
        .eq("service_date", session.date)
        .eq("academy_table_id", session.academyTableId)
        .eq("starts_at", session.startsAt)
        .single()
      if (deliveryError || !delivery) throw new Error("Could not locate the dated teaching session")
      const { data: seat, error: seatError } = await supabase
        .from("delivery_seats")
        .select("id")
        .eq("delivery_session_id", delivery.id)
        .eq("learner_id", learnerId)
        .eq("status", "scheduled")
        .single()
      if (seatError || !seat) throw new Error("Could not locate the learner's dated seat")
      const { data: previous, error: previousError } = await supabase
        .from("delivery_seat_time_overrides")
        .select("actual_starts_at,time_tbc")
        .eq("delivery_seat_id", seat.id)
        .maybeSingle()
      if (previousError) throw new Error("Could not check the previous teaching time")
      const actualStartsAt = session.timeTbc ? null : session.actualStartsAt || null
      const { error: overrideError } = await supabase
        .from("delivery_seat_time_overrides")
        .upsert({
          delivery_seat_id: seat.id,
          allocated_starts_at: session.startsAt,
          actual_starts_at: actualStartsAt,
          time_tbc: Boolean(session.timeTbc),
          updated_by: userId,
          updated_at: new Date().toISOString(),
        }, { onConflict: "delivery_seat_id" })
      if (overrideError) throw new Error("Could not save the dated teaching time")
      const { error: auditError } = await supabase
        .from("delivery_seat_time_override_audit")
        .insert({
          delivery_seat_id: seat.id,
          changed_by: userId,
          previous_starts_at: previous?.actual_starts_at || null,
          new_starts_at: actualStartsAt,
          previous_tbc: Boolean(previous?.time_tbc),
          new_tbc: Boolean(session.timeTbc),
        })
      if (auditError) throw new Error("Could not audit the dated teaching time")
    }
    allocated.push({
      ...session,
      learnerId,
      seatNumber,
    })
  }

  return allocated
}

export async function recordExactManualEnrolment(
  _previousState: ExactManualEnrolmentState,
  formData: FormData,
): Promise<ExactManualEnrolmentState> {
  try {
    const { user } = await requireAdmin()
    const parsed = manualSchema.safeParse({
      parentLeadId: formData.get("parentLeadId"),
      childLeadId: formData.get("childLeadId"),
      receivedOn: formData.get("receivedOn"),
      paymentReceived: formData.get("paymentReceived"),
      selectedSessions: formData.get("selectedSessions"),
    })
    if (!parsed.success) {
      return {
        error: "Check the child, payment and selected service dates.",
      }
    }

    const value = parsed.data
    const submitted = parseSessions(value.selectedSessions)
    const supabase = supabaseService()

    return await withFamilyBookingLock(supabase, value.parentLeadId, async () => {
      const [{ data: child, error: childError }, { data: plannedBookings, error: bookingError }] =
        await Promise.all([
          supabase
            .from("child_leads")
            .select("parent_lead_id,first_name,school_year")
            .eq("id", value.childLeadId)
            .single(),
          supabase
            .from("accepted_bookings")
            .select("id,status,weekly_table_template_id,session_price_plan_id,seat_number,planned_sessions")
            .eq("parent_lead_id", value.parentLeadId)
            .eq("child_lead_id", value.childLeadId)
            .in("status", paymentEligibleBookingStatuses)
            .order("weekday"),
        ])

      if (childError || !child || child.parent_lead_id !== value.parentLeadId) {
        return { error: "That child does not belong to this family." }
      }
      if (!child.first_name) {
        return { error: "Add the child’s first name before recording their place." }
      }
      if (bookingError || !(plannedBookings || []).length) {
        return {
          error: "Plan the child’s recurring places before confirming payment.",
        }
      }

      const templateIds = (plannedBookings || [])
        .map((booking) => booking.weekly_table_template_id)
        .filter((id): id is string => Boolean(id))
      const [
        { data: templates, error: templateError },
        { data: tables, error: tableError },
      ] = await Promise.all([
        supabase
          .from("weekly_table_templates")
          .select("id,weekday,table_number,academy_table_id,starts_at,duration_minutes,teacher_name,focus,status")
          .in("id", templateIds)
          .eq("status", "active"),
        supabase
          .from("academy_tables")
          .select("id,status")
          .eq("status", "active"),
      ])

      if (templateError || tableError) {
        return { error: "One or more planned recurring places could not be verified." }
      }

      const templateById = new Map((templates || []).map((item) => [item.id, item]))
      const tableIds = new Set((tables || []).map((item) => item.id))
      const bookingByTemplate = new Map(
        (plannedBookings || [])
          .filter((booking) => Boolean(booking.weekly_table_template_id))
          .map((booking) => [booking.weekly_table_template_id as string, booking]),
      )

      if (
        templateById.size !== templateIds.length ||
        (plannedBookings || []).some(
          (booking) =>
            !booking.weekly_table_template_id ||
            !booking.session_price_plan_id ||
            !templateById.has(booking.weekly_table_template_id),
        )
      ) {
        return { error: "A planned recurring place or price plan is no longer active." }
      }

      const submittedPlacementIds = new Set(submitted.map((item) => item.placementId))
      for (const templateId of templateIds) {
        if (!submittedPlacementIds.has(templateId)) {
          return { error: "Every planned recurring place needs at least one paid date." }
        }
      }

      const serverSessions = parseSessions(JSON.stringify((plannedBookings || []).flatMap(
        (booking) => Array.isArray(booking.planned_sessions) ? booking.planned_sessions : [],
      )))
      if (renewalOfferChanged(serverSessions, submitted)) {
        return { error: "The planned offer changed. Refresh before recording payment." }
      }
      for (const session of serverSessions) {
        const booking = bookingByTemplate.get(session.placementId)
        const template = templateById.get(session.placementId)
        if (!booking || !template ||
            !tableIds.has(template.academy_table_id) ||
            session.academyTableId !== template.academy_table_id ||
            session.tableNumber !== template.table_number ||
            session.startsAt !== template.starts_at.slice(0, 5)) {
          return { error: "The selected paid dates no longer match the saved recurring places." }
        }
      }

      const { data: existingLearner, error: learnerLookupError } = await supabase
        .from("learners")
        .select("id")
        .eq("child_lead_id", value.childLeadId)
        .maybeSingle()

      if (learnerLookupError) return { error: "The existing learner could not be checked." }
      let learner = existingLearner
      await assertDatesOpen(serverSessions, supabase)
      await assertPaidPeriodCapacity(serverSessions.map((session) => ({
        ...session, learnerId: learner?.id ?? null,
      })), supabase)

      const summary = paidPeriodSummary(serverSessions)
      if (!summary.periodStart || !summary.periodEnd) {
        return { error: "Choose at least one paid service date." }
      }

      const sessionsPerWeek = new Set(templateIds).size
      const payment = await writeFamilyPaidSessions({
        supabase,
        parentLeadId: value.parentLeadId,
        periodStart: summary.periodStart,
        periodEnd: summary.periodEnd,
        childLeadId: value.childLeadId,
        learnerId: learner?.id,
        sessions: serverSessions,
        receivedOn: value.receivedOn,
        userId: user.id,
      })

      if (!learner) {
        const { data: created, error } = await supabase
          .from("learners")
          .insert({
            parent_lead_id: value.parentLeadId,
            child_lead_id: value.childLeadId,
            first_name: child.first_name,
            year_group: child.school_year || null,
            status: "active",
            parent_information_confirmed: true,
          })
          .select("id")
          .single()
        if (error || !created) {
          return { error: "Payment was recorded, but the learner could not be created. Check the record before retrying." }
        }
        learner = created
      } else {
        const { error } = await supabase.from("learners").update({ status: "active" }).eq("id", learner.id)
        if (error) {
          return { error: "Payment was recorded, but the learner could not be activated. Check the record before retrying." }
        }
      }

      const datedSessions = serverSessions.map((session) => ({
        ...session,
        learnerId: learner.id,
      }))

      const { error: childPaymentError } = await supabase
        .from("child_payment_entitlements")
        .upsert(
          {
            payment_entitlement_id: payment.id,
            learner_id: learner.id,
            period_start: summary.periodStart,
            period_end: summary.periodEnd,
            sessions_per_week: sessionsPerWeek,
            status: "paid",
            recorded_by: user.id,
            selected_sessions: datedSessions,
            selected_session_count: datedSessions.length,
          },
          { onConflict: "learner_id,period_start,period_end" },
        )

      if (childPaymentError) {
        return { error: "Payment was recorded, but the child payment entitlement could not be activated. Check the record before retrying." }
      }

      const standingPlacementByTemplate = new Map<string, string>()
      for (const booking of plannedBookings || []) {
        const templateId = booking.weekly_table_template_id!
        const planId = booking.session_price_plan_id!
        const template = templateById.get(templateId)!

        const { data: activated, error: activatedLookupError } = await supabase
          .from("standing_placements")
          .select("id")
          .eq("learner_id", learner.id)
          .eq("academy_table_id", template.academy_table_id)
          .eq("weekday", template.weekday)
          .eq("starts_at", template.starts_at)
          .eq("session_price_plan_id", planId)
          .eq("effective_from", summary.periodStart)
          .eq("status", "active")
          .maybeSingle()
        if (activatedLookupError) {
          return { error: "The learner's standing place could not be checked. Retry against the saved offer." }
        }
        if (activated) {
          standingPlacementByTemplate.set(templateId, activated.id)
          continue
        }

        const { error: endError } = await supabase
          .from("standing_placements")
          .update({
            status: "ended",
            effective_to: summary.periodStart,
            updated_by: user.id,
          })
          .eq("learner_id", learner.id)
          .eq("weekday", template.weekday)
          .eq("academy_table_id", template.academy_table_id)
          .eq("starts_at", template.starts_at)
          .eq("status", "active")

        if (endError) {
          return { error: "Payment was recorded, but a previous standing place could not be updated. Check the record before retrying." }
        }

        const { data: placement, error: placementError } = await supabase
          .from("standing_placements")
          .insert({
            learner_id: learner.id,
            weekday: template.weekday,
            table_number: template.table_number,
            academy_table_id: template.academy_table_id,
            seat_number: booking.seat_number,
            starts_at: template.starts_at,
            duration_minutes: template.duration_minutes,
            teacher_name: template.teacher_name,
            focus: template.focus,
            session_price_plan_id: planId,
            effective_from: summary.periodStart,
            created_by: user.id,
            updated_by: user.id,
          })
          .select("id")
          .single()

        if (placementError || !placement) {
          return { error: "Payment was recorded, but one of the standing places could not be activated. Check the record before retrying." }
        }
        standingPlacementByTemplate.set(templateId, placement.id)
      }

      const exactSessions = datedSessions.map((session) => ({
        ...session,
        placementId:
          standingPlacementByTemplate.get(session.placementId) ||
          session.placementId,
      }))

      const allocatedSessions = await createDatedOperationsSeats(
        exactSessions,
        learner.id,
        user.id,
        supabase,
      )

      await writeFamilyPaidSessions({
        supabase,
        parentLeadId: value.parentLeadId,
        periodStart: summary.periodStart,
        periodEnd: summary.periodEnd,
        childLeadId: value.childLeadId,
        learnerId: learner.id,
        sessions: allocatedSessions,
        recordPayment: false,
      })
      await Promise.all([
        supabase
          .from("child_payment_entitlements")
          .update({
            selected_sessions: allocatedSessions,
            selected_session_count: allocatedSessions.length,
          })
          .eq("payment_entitlement_id", payment.id)
          .eq("learner_id", learner.id),
        supabase
          .from("accepted_bookings")
          .update({
            learner_id: learner.id,
            payment_entitlement_id: payment.id,
            status: "paid_active",
            paid_at: new Date().toISOString(),
            paid_by: user.id,
          })
          .in(
            "id",
            (plannedBookings || []).map((booking) => booking.id),
          ),
        supabase
          .from("child_leads")
          .update({ pipeline_status: "paid" })
          .eq("id", value.childLeadId),
      ])

      const { data: familyChildLeads } = await supabase
        .from("child_leads")
        .select("id,pipeline_status")
        .eq("parent_lead_id", value.parentLeadId)

      const allChildrenActivated =
        Boolean(familyChildLeads?.length) &&
        (familyChildLeads || []).every((item) => item.pipeline_status === "paid")

      const parentUpdate = allChildrenActivated
        ? {
            status: "converted",
            enrolled_at: new Date().toISOString(),
            enrolled_by: user.id,
            payment_confirmed_at: new Date().toISOString(),
            payment_confirmed_by: user.id,
          }
        : {
            payment_confirmed_at: new Date().toISOString(),
            payment_confirmed_by: user.id,
          }

      const { error: parentUpdateError } = await supabase
        .from("parent_leads")
        .update(parentUpdate)
        .eq("id", value.parentLeadId)

      if (parentUpdateError) {
        console.error("Child payment saved but family status update failed", {
          parentUpdateError,
          parentLeadId: value.parentLeadId,
        })
      }

      revalidatePath("/admin")
      revalidatePath("/admin/leads")
      revalidatePath("/admin/learners")
      revalidatePath("/admin/sessions")
      revalidatePath("/admin/payments")

      return {
        success: `Payment recorded for ${child.first_name}. ${allocatedSessions.length} dated Operations place${allocatedSessions.length === 1 ? "" : "s"} activated across ${sessionsPerWeek} recurring day${sessionsPerWeek === 1 ? "" : "s"}.`,
      }
    })
  } catch (error) {
    console.error("Exact manual enrolment failed:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not record this enrolment. Please try again.",
    }
  }
}

export async function prepareExactRenewalDraft(formData: FormData) {
  const { user } = await requireAdmin()
  try {
    await saveExactRenewalDraft(formData, user.id)
    return { success: true }
  } catch (error) {
    if (error instanceof RenewalDateError) return { error: error.message }
    if (error instanceof Error &&
        /^(Table \d+ at \d{2}:\d{2} is full|\w+,? \d+ \w+ is closed:)/.test(error.message)) {
      return { error: error.message }
    }
    console.error("Renewal plan save failed", { errorType: error instanceof Error ? error.name : "unknown" })
    return { error: "The renewal plan could not be saved. Your edits are still open. Try again." }
  }
}

async function saveExactRenewalDraft(formData: FormData, userId: string) {
  const parsed = renewalDraftSchema.safeParse({
    caseId: formData.get("caseId"),
    parentLeadId: formData.get("parentLeadId"),
    selectedSessions: formData.get("selectedSessions"),
    offerRevision: formData.get("offerRevision") ?? undefined,
  })
  if (!parsed.success) throw new RenewalDateError("Choose the exact sessions for this renewal")

  let submitted: PaidPeriodSession[]
  try {
    submitted = parseSessions(parsed.data.selectedSessions)
  } catch {
    throw new RenewalDateError("Check the selected dates and enter a valid price on each date.")
  }
  const supabase = supabaseService()
  const [
    { data: parent },
    { data: renewalCase },
    { data: placements },
    { data: plans },
    { data: template },
  ] = await Promise.all([
      supabase
        .from("parent_leads")
        .select("parent_name")
        .eq("id", parsed.data.parentLeadId)
        .single(),
      supabase
        .from("renewal_cases")
        .select("id,learner_id,status,updated_at,offer_revision,offer_payment_started_at,selected_sessions")
        .eq("id", parsed.data.caseId)
        .eq("parent_lead_id", parsed.data.parentLeadId)
        .maybeSingle(),
      supabase
        .from("standing_placements")
        .select(
          "id,learner_id,academy_table_id,table_number,weekday,starts_at,duration_minutes,teacher_name,focus,effective_from,effective_to,learners!inner(first_name,parent_lead_id)",
        )
        .eq("status", "active"),
      supabase
        .from("session_price_plans")
        .select("id,name,price_cents,status")
        .eq("status", "active"),
      supabase
        .from("academy_email_templates")
        .select("subject_template,body_template")
        .eq("template_key", "renewal_reminder")
        .maybeSingle(),
    ])

  if (!parent || !renewalCase)
    throw new RenewalDateError("This renewal is no longer available")
  if (renewalCase.status === "renewed" || renewalCase.status === "not_renewing")
    throw new RenewalDateError("This renewal is already complete")
  if (!renewalCase.learner_id)
    throw new RenewalDateError("This historical family renewal must be completed from the legacy renewal screen")

  if (renewalCase.offer_payment_started_at) {
    throw new RenewalDateError("Payment recording has started. Finish recording payment against the saved offer.")
  }
  if (renewalCase.offer_revision !== parsed.data.offerRevision) {
    throw new RenewalDateError("This renewal changed. Refresh before editing it again.")
  }

  const placementById = new Map(
    (placements || [])
      .filter((placement) => {
        const learner = Array.isArray(placement.learners)
          ? placement.learners[0]
          : placement.learners
        return (
          learner?.parent_lead_id === parsed.data.parentLeadId &&
          placement.learner_id === renewalCase.learner_id
        )
      })
      .map((placement) => [placement.id, placement]),
  )
  const planById = new Map((plans || []).map((plan) => [plan.id, plan]))

  const previouslySaved = Array.isArray(renewalCase.selected_sessions)
    ? renewalCase.selected_sessions
    : []
  const savedByDateAndPlace = new Map(previouslySaved.map((item) => [
    renewalDateKey(item), item,
  ]))
  const serverSessions: PaidPeriodSession[] = submitted.map((item) => {
    const placement = placementById.get(item.placementId)
    const learner = Array.isArray(placement?.learners) ? placement.learners[0] : placement?.learners
    return resolveRenewalDate({
      submitted: item,
      saved: savedByDateAndPlace.get(renewalDateKey(item)),
      learnerId: renewalCase.learner_id,
      plan: planById.get(item.pricePlanId),
      placement: placement && {
        placementId: placement.id,
        learnerId: placement.learner_id,
        learnerName: learner?.first_name || "Learner",
        effectiveFrom: placement.effective_from,
        effectiveTo: placement.effective_to,
        academyTableId: placement.academy_table_id,
        tableNumber: placement.table_number,
        startsAt: placement.starts_at,
        durationMinutes: placement.duration_minutes,
        teacherName: placement.teacher_name,
        weekday: placement.weekday,
        focus: placement.focus,
      },
    })
  })

  await assertDatesOpen(serverSessions, supabase)
  await assertPaidPeriodCapacity(serverSessions, supabase)

  const summary = paidPeriodSummary(serverSessions)
  if (!summary.periodStart || !summary.periodEnd)
    throw new RenewalDateError("Choose at least one service date")

  const emailDraft = renderRenewalEmail({
    parentName: parent.parent_name,
    sessions: serverSessions,
    subjectTemplate: template?.subject_template,
    bodyTemplate: template?.body_template,
  })

  const uniquePlanIds = [...new Set(serverSessions.map((session) => session.pricePlanId))]
  const changed = renewalOfferChanged(previouslySaved, serverSessions)
  if (!changed) return

  const { data: saved, error } = await supabase
    .from("renewal_cases")
    .update({
      offer_revision: renewalCase.offer_revision + 1,
      proposed_period_start: summary.periodStart,
      proposed_period_end: summary.periodEnd,
      proposed_session_price_plan_id: uniquePlanIds.length === 1 ? uniquePlanIds[0] : null,
      proposed_amount_cents: summary.amountCents,
      proposed_service_dates: [...new Set(serverSessions.map((session) => session.date))].sort(),
      selected_sessions: serverSessions,
      selected_session_count: serverSessions.length,
      draft_subject: emailDraft.subject,
      draft_body: emailDraft.body,
      updated_by: userId,
    })
    .eq("id", parsed.data.caseId)
    .eq("parent_lead_id", parsed.data.parentLeadId)
    .eq("learner_id", renewalCase.learner_id)
    .eq("updated_at", renewalCase.updated_at)
    .is("offer_payment_started_at", null)
    .or(`offer_operation_until.is.null,offer_operation_until.lt.${new Date().toISOString()}`)
    .select("id")
    .maybeSingle()
  if (error) throw new RenewalDateError("Could not save the exact renewal selection")
  if (!saved) throw new RenewalDateError("This renewal changed. Refresh before editing it again.")

  revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads")
}

export async function recordExactRenewalPayment(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = renewalPaymentSchema.safeParse({
    caseId: formData.get("caseId"),
    parentLeadId: formData.get("parentLeadId"),
    selectedSessions: formData.get("selectedSessions"),
    receivedOn: formData.get("receivedOn"),
    bankReference: formData.get("bankReference") || undefined,
    note: formData.get("note") || undefined,
  })
  if (!parsed.success) throw new Error("Check the renewal payment details")

  const submitted = parseSessions(parsed.data.selectedSessions)
  const supabase = supabaseService()
  const { data: renewal, error: renewalError } = await supabase
    .from("renewal_cases")
    .select("id,updated_at,selected_sessions,status,learner_id,standing_placement_id")
    .eq("id", parsed.data.caseId)
    .eq("parent_lead_id", parsed.data.parentLeadId)
    .single()
  if (renewalError || !renewal)
    throw new Error("This renewal is no longer available")
  if (renewal.status === "renewed" || renewal.status === "not_renewing")
    throw new Error("This renewal is already complete")
  if (!renewal.learner_id)
    throw new Error("This historical family renewal must be completed from the legacy renewal screen")

  const saved = parseSessions(JSON.stringify(renewal.selected_sessions || []))
  if (renewalOfferChanged(saved, submitted))
    throw new Error("The renewal selection changed. Save the exact sessions again before recording payment.")

  await assertDatesOpen(saved, supabase)
  await assertPaidPeriodCapacity(saved, supabase)
  const summary = paidPeriodSummary(saved)
  if (!summary.periodStart || !summary.periodEnd)
    throw new Error("This renewal has no selected service dates")

  const learnerIds = [...new Set(saved.map((session) => session.learnerId).filter(Boolean))] as string[]
  if (learnerIds.length !== 1 || learnerIds[0] !== renewal.learner_id) {
    throw new Error("This renewal must contain only the selected learner’s sessions")
  }
  await withRenewalOfferLock(supabase, renewal, async () => {
    const ledgerNote = [
      parsed.data.bankReference ? `Bank reference: ${parsed.data.bankReference}` : null,
      parsed.data.note || null,
    ]
      .filter(Boolean)
      .join(" · ")

    // Keep the terms fixed if an interrupted payment has already created
    // ledger entries or delivery seats. Retrying payment uses these same dates.
    const { error: paymentStartError } = await supabase.from("renewal_cases")
      .update({ offer_payment_started_at: new Date().toISOString() })
      .eq("id", renewal.id)
      .is("offer_payment_started_at", null)
    if (paymentStartError) throw new Error("Could not prepare the renewal for payment")

    const payment = await writeFamilyPaidSessions({
      supabase,
      parentLeadId: parsed.data.parentLeadId,
      periodStart: summary.periodStart!,
      periodEnd: summary.periodEnd!,
      learnerId: renewal.learner_id!,
      sessions: saved,
      receivedOn: parsed.data.receivedOn,
      userId: user.id,
      note: ledgerNote || null,
    })

    const allocatedSessions: PaidPeriodSession[] = []

    for (const learnerId of learnerIds) {
      const sessions = saved.filter((session) => session.learnerId === learnerId)
      const learnerSummary = paidPeriodSummary(sessions)
      if (!learnerSummary.periodStart || !learnerSummary.periodEnd) continue

      const allocated = await createDatedOperationsSeats(
        sessions,
        learnerId,
        user.id,
        supabase,
      )
      allocatedSessions.push(...allocated)

      const { error } = await supabase.from("child_payment_entitlements").upsert(
        {
          payment_entitlement_id: payment.id,
          learner_id: learnerId,
          period_start: learnerSummary.periodStart,
          period_end: learnerSummary.periodEnd,
          sessions_per_week: Math.max(
            1,
            new Set(sessions.map((session) => session.placementId)).size,
          ),
          status: "paid",
          recorded_by: user.id,
          selected_sessions: allocated,
          selected_session_count: allocated.length,
        },
        { onConflict: "learner_id,period_start,period_end" },
      )
      if (error) {
        throw new Error(
          "Payment was recorded, but a learner entitlement could not be activated",
        )
      }
    }

    const finalSessions = sortPaidPeriodSessions(allocatedSessions)
    await writeFamilyPaidSessions({
      supabase,
      parentLeadId: parsed.data.parentLeadId,
      periodStart: summary.periodStart!,
      periodEnd: summary.periodEnd!,
      learnerId: renewal.learner_id!,
      sessions: finalSessions,
      recordPayment: false,
    })

    await supabase
      .from("accepted_bookings")
      .update({ status: "paid_active" })
      .eq("learner_id", renewal.learner_id)
      .in("status", ["paid_active", "contacted", "accepted_awaiting_payment"])

    const { error: completeError } = await supabase
      .from("renewal_cases")
      .update({
        status: "renewed",
        renewed_at: new Date().toISOString(),
        selected_sessions: finalSessions,
        selected_session_count: finalSessions.length,
        updated_by: user.id,
      })
      .eq("id", parsed.data.caseId)
      .eq("parent_lead_id", parsed.data.parentLeadId)
    if (completeError)
      throw new Error("Payment was recorded, but the renewal case could not be completed")
  })

  revalidatePath("/admin")
  revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/payments")
  revalidatePath("/admin/business")
}
