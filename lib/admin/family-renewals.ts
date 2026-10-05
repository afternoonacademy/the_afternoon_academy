import type {
  AcademyClosure,
  PaidPeriodPlacement,
  PaidPeriodSession,
} from "@/lib/paid-period"
import { renderRenewalEmail } from "@/lib/email/renewal-email"
import { isRenewalDue } from "@/lib/admin/renewal-eligibility.mjs"
import { supabaseAdmin } from "@/lib/supabase/admin"

const iso = (date: Date) => date.toISOString().slice(0, 10)

function relation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

function isStructuredSession(value: unknown): value is PaidPeriodSession {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return Boolean(
    typeof item.placementId === "string" &&
      typeof item.learnerName === "string" &&
      (typeof item.learnerId === "string" || item.learnerId === null) &&
      typeof item.date === "string" &&
      typeof item.academyTableId === "string" &&
      typeof item.tableNumber === "number" &&
      (typeof item.seatNumber === "number" || item.seatNumber === null) &&
      typeof item.startsAt === "string" &&
      typeof item.durationMinutes === "number" &&
      typeof item.pricePlanId === "string" &&
      typeof item.pricePlanName === "string" &&
      typeof item.priceCents === "number" &&
      typeof item.replacement === "boolean",
  )
}

export type FamilyRenewalRow = {
  learnerId: string
  childLeadId: string | null
  parentLeadId: string
  parentName: string
  email: string
  learnerName: string
  sourcePaymentEntitlementId: string
  lastPaidServiceDate: string
  periodEnd: string
  caseId: string | null
  status: "needs_renewal" | "renewal_planned" | "renewal_contacted"
  selectedSessions: PaidPeriodSession[]
  proposedAmountCents: number | null
  proposedPeriodStart: string | null
  proposedPeriodEnd: string | null
  emailSentAt: string | null
  draftSubject: string | null
  draftBody: string | null
  emailDeliveryStatus: string | null
  emailDeliveryDetail: string | null
  emailDeliveryAt: string | null
  placements: PaidPeriodPlacement[]
  closures: AcademyClosure[]
  recurringCapacityHeld: boolean
}

export async function loadFamilyRenewals(): Promise<FamilyRenewalRow[]> {
  const today = new Date()
  const todayIso = iso(today)
  const [
    { data: entitlements },
    { data: cases },
    { data: placements },
    { data: closures },
    { data: datedSeats },
    { data: bookings },
    { data: renewalTemplate },
    { data: renewalDeliveryLogs },
  ] = await Promise.all([
    supabaseAdmin
      .from("child_payment_entitlements")
      .select(
        "payment_entitlement_id,learner_id,period_end,learners(id,child_lead_id,first_name,parent_lead_id,status,parent_leads(id,parent_name,email))",
      )
      .eq("status", "paid")
      .order("period_end", { ascending: false }),
    supabaseAdmin
      .from("renewal_cases")
      .select(
        "id,learner_id,parent_lead_id,source_payment_entitlement_id,status,email_sent_at,proposed_period_start,proposed_period_end,proposed_amount_cents,selected_sessions,draft_subject,draft_body",
      )
      .not("learner_id", "is", null)
      .in("status", ["ready_to_send", "awaiting_payment", "overdue"]),
    supabaseAdmin
      .from("standing_placements")
      .select(
        "id,learner_id,session_price_plan_id,weekday,academy_table_id,table_number,seat_number,starts_at,duration_minutes,teacher_name,focus,status,learners(first_name,parent_lead_id),session_price_plans(id,name,price_cents)",
      )
      .eq("status", "active"),
    supabaseAdmin
      .from("academy_closures")
      .select("starts_on,ends_on,reason")
      .order("starts_on"),
    supabaseAdmin
      .from("delivery_seats")
      .select("learner_id,status,delivery_sessions(service_date)")
      .eq("status", "scheduled"),
    supabaseAdmin
      .from("accepted_bookings")
      .select("learner_id,status")
      .in("status", ["paid_active", "session_planned", "contacted", "accepted_awaiting_payment"]),
    supabaseAdmin
      .from("academy_email_templates")
      .select("subject_template,body_template")
      .eq("template_key", "renewal_reminder")
      .maybeSingle(),
    supabaseAdmin
      .from("email_delivery_log")
      .select(
        "renewal_case_id,status,delivery_detail,error_message,sent_at,delivered_at,bounced_at,failed_at,created_at",
      )
      .eq("email_kind", "renewal_reminder")
      .order("created_at", { ascending: false }),
  ])

  const academyClosures: AcademyClosure[] = (closures || []).map((closure) => ({
    startsOn: closure.starts_on,
    endsOn: closure.ends_on,
    reason: closure.reason,
  }))

  const latestDatedSeatByLearner = new Map<string, string>()
  for (const seat of datedSeats || []) {
    const delivery = relation(seat.delivery_sessions)
    if (!delivery?.service_date) continue
    const current = latestDatedSeatByLearner.get(seat.learner_id)
    if (!current || delivery.service_date > current) {
      latestDatedSeatByLearner.set(seat.learner_id, delivery.service_date)
    }
  }

  const placementsByLearner = new Map<string, PaidPeriodPlacement[]>()
  for (const placement of placements || []) {
    const learner = relation(placement.learners)
    const plan = relation(placement.session_price_plans)
    if (!learner || !plan || !placement.session_price_plan_id) continue

    const list = placementsByLearner.get(placement.learner_id) || []
    list.push({
      placementId: placement.id,
      learnerId: placement.learner_id,
      learnerName: learner.first_name || "Learner",
      weekday: placement.weekday,
      academyTableId: placement.academy_table_id,
      tableNumber: placement.table_number,
      seatNumber: placement.seat_number,
      startsAt: placement.starts_at.slice(0, 5),
      durationMinutes: placement.duration_minutes,
      teacherName: placement.teacher_name,
      focus: placement.focus,
      pricePlanId: placement.session_price_plan_id,
      pricePlanName: plan.name,
      priceCents: plan.price_cents,
    })
    placementsByLearner.set(placement.learner_id, list)
  }

  const capacityHeldLearners = new Set(
    (bookings || [])
      .filter((booking) => Boolean(booking.learner_id))
      .map((booking) => booking.learner_id as string),
  )

  const casesByLearnerSource = new Map(
    (cases || []).map((item) => [
      item.learner_id + ":" + item.source_payment_entitlement_id,
      item,
    ]),
  )

  const latestDeliveryByRenewal = new Map<string, NonNullable<typeof renewalDeliveryLogs>[number]>()
  for (const delivery of renewalDeliveryLogs || []) {
    if (
      delivery.renewal_case_id &&
      !latestDeliveryByRenewal.has(delivery.renewal_case_id)
    ) {
      latestDeliveryByRenewal.set(delivery.renewal_case_id, delivery)
    }
  }

  // One renewal row per learner, using only that learner's latest paid entitlement.
  const latestByLearner = new Map<string, NonNullable<typeof entitlements>[number]>()
  for (const entitlement of entitlements || []) {
    if (!latestByLearner.has(entitlement.learner_id)) {
      latestByLearner.set(entitlement.learner_id, entitlement)
    }
  }

  const rows: FamilyRenewalRow[] = []
  for (const entitlement of latestByLearner.values()) {
    // A learner enters Renewals on their final paid service date, not weeks
    // beforehand. Until then they remain an active paid customer.
    if (!isRenewalDue(entitlement.period_end, todayIso)) continue

    const learner = relation(entitlement.learners)
    const parent = learner ? relation(learner.parent_leads) : null
    if (!learner || learner.status !== "active" || !parent) continue

    const learnerPlacements = placementsByLearner.get(learner.id) || []
    if (!learnerPlacements.length) continue

    const renewal = casesByLearnerSource.get(
      learner.id + ":" + entitlement.payment_entitlement_id,
    )
    if (renewal?.status === "renewed" || renewal?.status === "not_renewing") {
      continue
    }

    const rawSessions = Array.isArray(renewal?.selected_sessions)
      ? renewal.selected_sessions
      : []
    const selectedSessions = rawSessions
      .filter(isStructuredSession)
      .map((session) => ({ ...session }))

    const status: FamilyRenewalRow["status"] =
      renewal?.status === "awaiting_payment"
        ? "renewal_contacted"
        : selectedSessions.length
          ? "renewal_planned"
          : "needs_renewal"

    const currentEmailDraft = selectedSessions.length
      ? renderRenewalEmail({
          parentName: parent.parent_name,
          sessions: selectedSessions,
          subjectTemplate: renewalTemplate?.subject_template,
          bodyTemplate: renewalTemplate?.body_template,
        })
      : null

    rows.push({
      learnerId: learner.id,
      childLeadId: learner.child_lead_id,
      parentLeadId: learner.parent_lead_id,
      parentName: parent.parent_name,
      email: parent.email,
      learnerName: learner.first_name || "Learner",
      sourcePaymentEntitlementId: entitlement.payment_entitlement_id,
      lastPaidServiceDate:
        latestDatedSeatByLearner.get(learner.id) || entitlement.period_end,
      periodEnd: entitlement.period_end,
      caseId: renewal?.id || null,
      status,
      selectedSessions,
      proposedAmountCents: renewal?.proposed_amount_cents || null,
      proposedPeriodStart: renewal?.proposed_period_start || null,
      proposedPeriodEnd: renewal?.proposed_period_end || null,
      emailSentAt: renewal?.email_sent_at || null,
      draftSubject: currentEmailDraft?.subject || renewal?.draft_subject || null,
      draftBody: currentEmailDraft?.body || renewal?.draft_body || null,
      emailDeliveryStatus: renewal?.id
        ? latestDeliveryByRenewal.get(renewal.id)?.status || null
        : null,
      emailDeliveryDetail: renewal?.id
        ? latestDeliveryByRenewal.get(renewal.id)?.delivery_detail ||
          latestDeliveryByRenewal.get(renewal.id)?.error_message ||
          null
        : null,
      emailDeliveryAt: renewal?.id
        ? latestDeliveryByRenewal.get(renewal.id)?.delivered_at ||
          latestDeliveryByRenewal.get(renewal.id)?.bounced_at ||
          latestDeliveryByRenewal.get(renewal.id)?.failed_at ||
          latestDeliveryByRenewal.get(renewal.id)?.sent_at ||
          null
        : null,
      placements: learnerPlacements,
      closures: academyClosures,
      recurringCapacityHeld: capacityHeldLearners.has(learner.id),
    })
  }

  return rows.sort((a, b) =>
    a.lastPaidServiceDate.localeCompare(b.lastPaidServiceDate),
  )
}
