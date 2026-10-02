"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
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
  seatNumber: z.coerce.number().int().min(1).max(40),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  teacherName: z.string().trim().max(160).nullable(),
  focus: z.string().trim().max(500).nullable(),
  pricePlanId: z.string().uuid(),
  pricePlanName: z.string().trim().min(1).max(160),
  priceCents: z.coerce.number().int().min(0),
  replacement: z.boolean(),
})

const manualSchema = z.object({
  parentLeadId: z.string().uuid(),
  childLeadId: z.string().uuid(),
  templateId: z.string().uuid(),
  seatNumber: z.coerce.number().int().min(1).max(40),
  pricePlanId: z.string().uuid(),
  receivedOn: z.string().date(),
  paymentReceived: z.literal("yes"),
  selectedSessions: z.string().min(2),
})

const renewalSchema = z.object({
  caseId: z.string().uuid(),
  parentLeadId: z.string().uuid(),
  selectedSessions: z.string().min(2),
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
  const parsed = z.array(selectedSessionSchema).min(1).safeParse(value)
  if (!parsed.success) throw new Error("Choose at least one valid paid service date")
  const unique = new Set<string>()
  for (const session of parsed.data) {
    const key = `${session.placementId}|${session.date}|${session.startsAt}`
    if (unique.has(key)) throw new Error("A service date is selected more than once")
    unique.add(key)
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

async function assertDatedSeatAvailability(
  sessions: PaidPeriodSession[],
  supabase: ReturnType<typeof supabaseService>,
) {
  for (const session of sessions) {
    const { data: delivery, error: sessionError } = await supabase
      .from("delivery_sessions")
      .select("id")
      .eq("service_date", session.date)
      .eq("academy_table_id", session.academyTableId)
      .eq("starts_at", session.startsAt)
      .maybeSingle()
    if (sessionError) throw new Error("Could not check a selected Operations session")
    if (!delivery) continue

    const { data: occupied, error: occupiedError } = await supabase
      .from("delivery_seats")
      .select("learner_id")
      .eq("delivery_session_id", delivery.id)
      .eq("seat_number", session.seatNumber)
      .in("status", ["scheduled", "payment_pending"])
      .maybeSingle()
    if (occupiedError) throw new Error("Could not check a selected Operations seat")
    if (
      occupied &&
      (!session.learnerId || occupied.learner_id !== session.learnerId)
    ) {
      throw new Error(
        `Seat ${session.seatNumber} at Table ${session.tableNumber} is occupied on ${formatDate(session.date)} at ${session.startsAt}. Choose another place/date before saving.`,
      )
    }

    if (session.learnerId) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("delivery_seats")
        .select("id")
        .eq("delivery_session_id", delivery.id)
        .eq("learner_id", session.learnerId)
        .in("status", ["scheduled", "payment_pending"])
        .maybeSingle()
      if (duplicateError) throw new Error("Could not check duplicate learner allocation")
      if (duplicate && occupied?.learner_id !== session.learnerId) {
        throw new Error(
          `${session.learnerName} is already allocated to this session on ${formatDate(session.date)}.`,
        )
      }
    }
  }
}

async function createDatedOperationsSeats(
  sessions: PaidPeriodSession[],
  learnerId: string,
  userId: string,
  supabase: ReturnType<typeof supabaseService>,
) {
  for (const session of sessions) {
    const { data: delivery, error: deliveryError } = await supabase
      .from("delivery_sessions")
      .upsert(
        {
          service_date: session.date,
          table_number: session.tableNumber,
          academy_table_id: session.academyTableId,
          starts_at: session.startsAt,
          duration_minutes: session.durationMinutes,
          teacher_name: session.teacherName,
          focus: session.focus,
          status: "scheduled",
          created_by: userId,
          updated_by: userId,
        },
        { onConflict: "service_date,academy_table_id,starts_at" },
      )
      .select("id")
      .single()
    if (deliveryError || !delivery)
      throw new Error(
        `Payment was recorded, but the Operations session for ${formatDate(session.date)} could not be created. Do not retry payment until this record is checked.`,
      )

    const { data: occupied } = await supabase
      .from("delivery_seats")
      .select("learner_id")
      .eq("delivery_session_id", delivery.id)
      .eq("seat_number", session.seatNumber)
      .in("status", ["scheduled", "payment_pending"])
      .maybeSingle()
    if (occupied && occupied.learner_id !== learnerId) {
      throw new Error(
        `Payment was recorded, but Seat ${session.seatNumber} became occupied on ${formatDate(session.date)}. Resolve the Operations seat before retrying.`,
      )
    }

    const { error: seatError } = await supabase.from("delivery_seats").upsert(
      {
        delivery_session_id: delivery.id,
        learner_id: learnerId,
        seat_number: session.seatNumber,
        status: "scheduled",
        note: session.replacement ? "Paid replacement session" : null,
        updated_by: userId,
      },
      { onConflict: "delivery_session_id,learner_id" },
    )
    if (seatError)
      throw new Error(
        `Payment was recorded, but the dated seat for ${formatDate(session.date)} could not be created. Do not retry payment until this record is checked.`,
      )
  }
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
      templateId: formData.get("templateId"),
      seatNumber: formData.get("seatNumber"),
      pricePlanId: formData.get("pricePlanId"),
      receivedOn: formData.get("receivedOn"),
      paymentReceived: formData.get("paymentReceived"),
      selectedSessions: formData.get("selectedSessions"),
    })
    if (!parsed.success)
      return { error: "Check the child, recurring place, payment and selected service dates." }

    const value = parsed.data
    const submitted = parseSessions(value.selectedSessions)
    const supabase = supabaseService()

    const [
      { data: child, error: childError },
      { data: template, error: templateError },
      { data: pricePlan, error: pricePlanError },
      { data: table, error: tableError },
    ] = await Promise.all([
      supabase
        .from("child_leads")
        .select("parent_lead_id,first_name,school_year")
        .eq("id", value.childLeadId)
        .single(),
      supabase
        .from("weekly_table_templates")
        .select(
          "id,weekday,table_number,academy_table_id,starts_at,duration_minutes,teacher_name,focus,status",
        )
        .eq("id", value.templateId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("session_price_plans")
        .select("id,name,price_cents,status")
        .eq("id", value.pricePlanId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("academy_tables")
        .select("id,seat_capacity,status")
        .eq("id", submitted[0]?.academyTableId || "00000000-0000-0000-0000-000000000000")
        .maybeSingle(),
    ])

    if (childError || !child || child.parent_lead_id !== value.parentLeadId)
      return { error: "That child does not belong to this family." }
    if (!child.first_name)
      return { error: "Add the child’s first name before recording their place." }
    if (templateError || !template)
      return { error: "That recurring Academy place is no longer available." }
    if (pricePlanError || !pricePlan)
      return { error: "Choose an active price plan for this learner." }
    if (
      tableError ||
      !table ||
      table.id !== template.academy_table_id ||
      table.status !== "active" ||
      value.seatNumber > table.seat_capacity
    )
      return { error: "Choose an available seat on the active Academy table." }

    const serverSessions: PaidPeriodSession[] = submitted.map((item) => {
      if (
        item.placementId !== template.id ||
        item.academyTableId !== template.academy_table_id ||
        item.tableNumber !== template.table_number ||
        item.seatNumber !== value.seatNumber ||
        item.startsAt !== template.starts_at.slice(0, 5) ||
        item.pricePlanId !== pricePlan.id
      ) {
        throw new Error("The selected paid dates no longer match the chosen recurring place")
      }
      return {
        learnerId: null,
        learnerName: child.first_name,
        childLeadId: value.childLeadId,
        placementId: template.id,
        date: item.date,
        academyTableId: template.academy_table_id,
        tableNumber: template.table_number,
        seatNumber: value.seatNumber,
        startsAt: template.starts_at.slice(0, 5),
        durationMinutes: template.duration_minutes,
        teacherName: template.teacher_name,
        focus: template.focus,
        pricePlanId: pricePlan.id,
        pricePlanName: pricePlan.name,
        priceCents: pricePlan.price_cents,
        replacement:
          new Date(`${item.date}T12:00:00Z`).getUTCDay() !== template.weekday,
      }
    })

    await assertDatesOpen(serverSessions, supabase)
    await assertDatedSeatAvailability(serverSessions, supabase)

    const { data: recurringOccupied, error: recurringError } = await supabase
      .from("accepted_bookings")
      .select("id")
      .eq("weekday", template.weekday)
      .eq("academy_table_id", template.academy_table_id)
      .eq("starts_at", template.starts_at)
      .eq("seat_number", value.seatNumber)
      .in("status", ["accepted_awaiting_payment", "paid_active"])
      .maybeSingle()
    if (recurringError) return { error: "Could not verify the recurring seat." }
    if (recurringOccupied)
      return { error: "That recurring seat is already in use. Choose another seat." }

    const summary = paidPeriodSummary(serverSessions)
    if (!summary.periodStart || !summary.periodEnd)
      return { error: "Choose at least one paid service date." }

    const { data: booking, error: bookingError } = await supabase
      .from("accepted_bookings")
      .insert({
        parent_lead_id: value.parentLeadId,
        child_lead_id: value.childLeadId,
        weekday: template.weekday,
        table_number: template.table_number,
        academy_table_id: template.academy_table_id,
        seat_number: value.seatNumber,
        starts_at: template.starts_at,
        duration_minutes: template.duration_minutes,
        accepted_by: user.id,
      })
      .select("id")
      .single()
    if (bookingError || !booking)
      return { error: "Could not save the recurring seat." }

    const { data: payment, error: paymentError } = await supabase
      .from("payment_entitlements")
      .upsert(
        {
          parent_lead_id: value.parentLeadId,
          period_start: summary.periodStart,
          period_end: summary.periodEnd,
          sessions_per_week: 1,
          status: "paid",
          amount_cents: summary.amountCents,
          received_at: `${value.receivedOn}T12:00:00Z`,
          recorded_by: user.id,
          selected_sessions: serverSessions,
          selected_session_count: serverSessions.length,
        },
        { onConflict: "parent_lead_id,period_start,period_end" },
      )
      .select("id")
      .single()
    if (paymentError || !payment)
      return {
        error:
          "The recurring seat was saved, but the payment record could not be created. Check the record before retrying.",
      }

    let { data: learner } = await supabase
      .from("learners")
      .select("id")
      .eq("child_lead_id", value.childLeadId)
      .maybeSingle()
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
      if (error || !created)
        return {
          error:
            "Payment was recorded, but the learner could not be created. Check the record before retrying.",
        }
      learner = created
    } else {
      const { error } = await supabase
        .from("learners")
        .update({ status: "active" })
        .eq("id", learner.id)
      if (error)
        return {
          error:
            "Payment was recorded, but the learner could not be activated. Check the record before retrying.",
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
          sessions_per_week: 1,
          status: "paid",
          recorded_by: user.id,
          selected_sessions: datedSessions,
          selected_session_count: datedSessions.length,
        },
        { onConflict: "learner_id,period_start,period_end" },
      )
    if (childPaymentError)
      return {
        error:
          "Payment was recorded, but the child payment entitlement could not be activated. Check the record before retrying.",
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
      .eq("status", "active")
    if (endError)
      return {
        error:
          "Payment was recorded, but the previous standing place could not be updated. Check the record before retrying.",
      }

    const { data: placement, error: placementError } = await supabase
      .from("standing_placements")
      .insert({
        learner_id: learner.id,
        weekday: template.weekday,
        table_number: template.table_number,
        academy_table_id: template.academy_table_id,
        seat_number: value.seatNumber,
        starts_at: template.starts_at,
        duration_minutes: template.duration_minutes,
        teacher_name: template.teacher_name,
        focus: template.focus,
        session_price_plan_id: pricePlan.id,
        effective_from: summary.periodStart,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single()
    if (placementError || !placement)
      return {
        error:
          "Payment was recorded, but the standing place could not be activated. Check the record before retrying.",
      }

    const exactSessions = datedSessions.map((session) => ({
      ...session,
      placementId: placement.id,
    }))

    await createDatedOperationsSeats(exactSessions, learner.id, user.id, supabase)

    await Promise.all([
      supabase
        .from("payment_entitlements")
        .update({
          selected_sessions: exactSessions,
          selected_session_count: exactSessions.length,
        })
        .eq("id", payment.id),
      supabase
        .from("child_payment_entitlements")
        .update({
          selected_sessions: exactSessions,
          selected_session_count: exactSessions.length,
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
        .eq("id", booking.id),
      supabase
        .from("parent_leads")
        .update({
          status: "converted",
          enrolled_at: new Date().toISOString(),
          enrolled_by: user.id,
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by: user.id,
        })
        .eq("id", value.parentLeadId),
    ])

    revalidatePath("/admin")
    revalidatePath("/admin/leads")
    revalidatePath("/admin/learners")
    revalidatePath("/admin/sessions")
    revalidatePath("/admin/payments")
    return {
      success: `Payment recorded. ${serverSessions.length} exact dated Operations seat${serverSessions.length === 1 ? "" : "s"} activated. No parent email was sent automatically.`,
    }
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
  const parsed = renewalSchema.safeParse({
    caseId: formData.get("caseId"),
    parentLeadId: formData.get("parentLeadId"),
    selectedSessions: formData.get("selectedSessions"),
  })
  if (!parsed.success) throw new Error("Choose the exact sessions for this renewal")

  const submitted = parseSessions(parsed.data.selectedSessions)
  const supabase = supabaseService()
  const [{ data: parent }, { data: placements }, { data: plans }, { data: template }] =
    await Promise.all([
      supabase
        .from("parent_leads")
        .select("parent_name")
        .eq("id", parsed.data.parentLeadId)
        .single(),
      supabase
        .from("standing_placements")
        .select(
          "id,learner_id,academy_table_id,table_number,seat_number,weekday,starts_at,duration_minutes,teacher_name,focus,learners!inner(first_name,parent_lead_id)",
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

  if (!parent) throw new Error("This renewal family is no longer available")

  const placementById = new Map(
    (placements || [])
      .filter((placement) => {
        const learner = Array.isArray(placement.learners)
          ? placement.learners[0]
          : placement.learners
        return learner?.parent_lead_id === parsed.data.parentLeadId
      })
      .map((placement) => [placement.id, placement]),
  )
  const planById = new Map((plans || []).map((plan) => [plan.id, plan]))

  const serverSessions: PaidPeriodSession[] = submitted.map((item) => {
    const placement = placementById.get(item.placementId)
    if (!placement) throw new Error("A selected learner place is no longer active")
    const learner = Array.isArray(placement.learners)
      ? placement.learners[0]
      : placement.learners
    const plan = planById.get(item.pricePlanId)
    if (!plan) throw new Error("A selected price plan is no longer active")
    if (
      item.learnerId !== placement.learner_id ||
      item.academyTableId !== placement.academy_table_id ||
      item.tableNumber !== placement.table_number ||
      item.seatNumber !== placement.seat_number ||
      item.startsAt !== placement.starts_at.slice(0, 5)
    ) {
      throw new Error("A selected session no longer matches the learner’s standing place")
    }
    return {
      learnerId: placement.learner_id,
      learnerName: learner?.first_name || "Learner",
      childLeadId: null,
      placementId: placement.id,
      date: item.date,
      academyTableId: placement.academy_table_id,
      tableNumber: placement.table_number,
      seatNumber: placement.seat_number,
      startsAt: placement.starts_at.slice(0, 5),
      durationMinutes: placement.duration_minutes,
      teacherName: placement.teacher_name,
      focus: placement.focus,
      pricePlanId: plan.id,
      pricePlanName: plan.name,
      priceCents: plan.price_cents,
      replacement:
        new Date(`${item.date}T12:00:00Z`).getUTCDay() !== placement.weekday,
    }
  })

  await assertDatesOpen(serverSessions, supabase)
  await assertDatedSeatAvailability(serverSessions, supabase)

  const summary = paidPeriodSummary(serverSessions)
  if (!summary.periodStart || !summary.periodEnd)
    throw new Error("Choose at least one service date")

  const learnerNames = [...new Set(serverSessions.map((session) => session.learnerName))]
  const serviceDates = serverSessions
    .map(
      (session) =>
        `${session.learnerName} · ${formatDate(session.date)} · ${session.startsAt}${session.replacement ? " · replacement" : ""}`,
    )
    .join("\n")
  const amountDue = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(summary.amountCents / 100)
  const values: Record<string, string> = {
    parent_name: parent.parent_name,
    learner_names: learnerNames.join(", "),
    service_dates: serviceDates,
    session_count: String(serverSessions.length),
    amount_due: amountDue,
  }
  const applyTemplate = (source: string) =>
    Object.entries(values).reduce(
      (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
      source,
    )
  const defaultSubject = "Renewal for {{learner_names}} at The Afternoon Academy"
  const defaultBody =
    "Hello {{parent_name}},\n\nYour next Academy period includes:\n{{service_dates}}\n\nThat is {{session_count}} session(s), totalling {{amount_due}}.\n\nIf you would like to continue, please make your usual bank transfer. We will confirm the period once the funds have cleared.\n\nWarmly,\nThe Afternoon Academy"

  const uniquePlanIds = [...new Set(serverSessions.map((session) => session.pricePlanId))]
  const { error } = await supabase
    .from("renewal_cases")
    .update({
      proposed_period_start: summary.periodStart,
      proposed_period_end: summary.periodEnd,
      proposed_session_price_plan_id: uniquePlanIds.length === 1 ? uniquePlanIds[0] : null,
      proposed_amount_cents: summary.amountCents,
      proposed_service_dates: [...new Set(serverSessions.map((session) => session.date))].sort(),
      selected_sessions: serverSessions,
      selected_session_count: serverSessions.length,
      draft_subject: applyTemplate(template?.subject_template || defaultSubject),
      draft_body: applyTemplate(template?.body_template || defaultBody),
      updated_by: user.id,
    })
    .eq("id", parsed.data.caseId)
    .eq("parent_lead_id", parsed.data.parentLeadId)
  if (error) throw new Error("Could not save the exact renewal selection")

  revalidatePath("/admin/renewals")
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
    .select("selected_sessions,status")
    .eq("id", parsed.data.caseId)
    .eq("parent_lead_id", parsed.data.parentLeadId)
    .single()
  if (renewalError || !renewal)
    throw new Error("This renewal is no longer available")
  if (renewal.status === "renewed" || renewal.status === "not_renewing")
    throw new Error("This renewal is already complete")

  const saved = parseSessions(JSON.stringify(renewal.selected_sessions || []))
  if (JSON.stringify(saved) !== JSON.stringify(submitted))
    throw new Error("The renewal selection changed. Save the exact sessions again before recording payment.")

  await assertDatesOpen(saved, supabase)
  await assertDatedSeatAvailability(saved, supabase)
  const summary = paidPeriodSummary(saved)
  if (!summary.periodStart || !summary.periodEnd)
    throw new Error("This renewal has no selected service dates")

  const learnerIds = [...new Set(saved.map((session) => session.learnerId).filter(Boolean))] as string[]
  const ledgerNote = [
    parsed.data.bankReference ? `Bank reference: ${parsed.data.bankReference}` : null,
    parsed.data.note || null,
  ]
    .filter(Boolean)
    .join(" · ")

  const { data: payment, error: paymentError } = await supabase
    .from("payment_entitlements")
    .upsert(
      {
        parent_lead_id: parsed.data.parentLeadId,
        period_start: summary.periodStart,
        period_end: summary.periodEnd,
        sessions_per_week: Math.max(1, learnerIds.length),
        status: "paid",
        amount_cents: summary.amountCents,
        received_at: `${parsed.data.receivedOn}T12:00:00Z`,
        recorded_by: user.id,
        note: ledgerNote || null,
        selected_sessions: saved,
        selected_session_count: saved.length,
      },
      { onConflict: "parent_lead_id,period_start,period_end" },
    )
    .select("id")
    .single()
  if (paymentError || !payment) throw new Error("Could not record the received payment")

  for (const learnerId of learnerIds) {
    const sessions = saved.filter((session) => session.learnerId === learnerId)
    const learnerSummary = paidPeriodSummary(sessions)
    if (!learnerSummary.periodStart || !learnerSummary.periodEnd) continue
    const { error } = await supabase.from("child_payment_entitlements").upsert(
      {
        payment_entitlement_id: payment.id,
        learner_id: learnerId,
        period_start: learnerSummary.periodStart,
        period_end: learnerSummary.periodEnd,
        sessions_per_week: 1,
        status: "paid",
        recorded_by: user.id,
        selected_sessions: sessions,
        selected_session_count: sessions.length,
      },
      { onConflict: "learner_id,period_start,period_end" },
    )
    if (error)
      throw new Error("Payment was recorded, but a learner entitlement could not be activated")

    await createDatedOperationsSeats(sessions, learnerId, user.id, supabase)
  }

  const plansByPlacement = new Map<string, string>()
  for (const session of saved) {
    const previous = plansByPlacement.get(session.placementId)
    if (previous && previous !== session.pricePlanId)
      throw new Error("A learner place has more than one price plan in the same paid period")
    plansByPlacement.set(session.placementId, session.pricePlanId)
  }
  for (const [placementId, pricePlanId] of plansByPlacement) {
    const { error } = await supabase
      .from("standing_placements")
      .update({ session_price_plan_id: pricePlanId, updated_by: user.id })
      .eq("id", placementId)
      .eq("status", "active")
    if (error)
      throw new Error(
        "Payment was recorded, but a selected price plan could not be applied to the learner’s standing place",
      )
  }

  const { error: completeError } = await supabase
    .from("renewal_cases")
    .update({
      status: "renewed",
      renewed_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", parsed.data.caseId)
    .eq("parent_lead_id", parsed.data.parentLeadId)
  if (completeError)
    throw new Error("Payment was recorded, but the renewal case could not be completed")

  revalidatePath("/admin")
  revalidatePath("/admin/renewals")
  revalidatePath("/admin/payments")
  revalidatePath("/admin/business")
}
