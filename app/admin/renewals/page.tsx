/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  RenewalWorkflowTable,
  type RenewalWorkflowRow,
} from "@/components/admin/renewal-workflow-table"
import type {
  AcademyClosure,
  PaidPeriodPlacement,
  PaidPeriodSession,
} from "@/lib/paid-period"
import { supabaseAdmin } from "@/lib/supabase/admin"

const iso = (date: Date) => date.toISOString().slice(0, 10)

function relation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

function isStructuredSession(value: any): value is PaidPeriodSession {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.placementId === "string" &&
      typeof value.learnerName === "string" &&
      (typeof value.learnerId === "string" || value.learnerId === null) &&
      typeof value.date === "string" &&
      typeof value.academyTableId === "string" &&
      typeof value.tableNumber === "number" &&
      (typeof value.seatNumber === "number" || value.seatNumber === null) &&
      typeof value.startsAt === "string" &&
      typeof value.durationMinutes === "number" &&
      typeof value.pricePlanId === "string" &&
      typeof value.pricePlanName === "string" &&
      typeof value.priceCents === "number" &&
      typeof value.replacement === "boolean",
  )
}

function isLegacySession(value: any) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.date === "string" &&
      typeof value.startsAt === "string" &&
      typeof value.priceCents === "number" &&
      !isStructuredSession(value),
  )
}

export default async function RenewalsPage() {
  const today = new Date()
  const horizon = new Date(today)
  horizon.setDate(horizon.getDate() + 21)
  const lookback = new Date(today)
  lookback.setDate(lookback.getDate() - 90)

  const [
    { data: entitlements },
    { data: cases },
    { data: pricePlans },
    { data: placements },
    { data: closures },
    { data: datedSeats },
  ] = await Promise.all([
    supabaseAdmin
      .from("child_payment_entitlements")
      .select(
        "payment_entitlement_id,period_end,learners(id,first_name,parent_lead_id,parent_leads(id,parent_name,email))",
      )
      .eq("status", "paid")
      .gte("period_end", iso(lookback))
      .lte("period_end", iso(horizon))
      .order("period_end"),
    supabaseAdmin
      .from("renewal_cases")
      .select(
        "id,parent_lead_id,source_payment_entitlement_id,status,email_sent_at,proposed_period_start,proposed_period_end,proposed_amount_cents,proposed_service_dates,selected_sessions,draft_subject,draft_body,provisional_delivery_until",
      )
      .in("status", ["ready_to_send", "awaiting_payment", "overdue"]),
    supabaseAdmin
      .from("session_price_plans")
      .select("id,name,price_cents")
      .eq("status", "active")
      .order("name"),
    supabaseAdmin
      .from("standing_placements")
      .select(
        "id,learner_id,session_price_plan_id,weekday,academy_table_id,table_number,seat_number,starts_at,duration_minutes,teacher_name,focus,learners(parent_lead_id,first_name),session_price_plans(id,name,price_cents)",
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

  const placementsByParent = new Map<string, PaidPeriodPlacement[]>()
  for (const placement of placements || []) {
    const learner = relation(placement.learners)
    const plan = relation(placement.session_price_plans)
    if (
      !learner?.parent_lead_id ||
      !plan ||
      !placement.session_price_plan_id
    )
      continue

    const item: PaidPeriodPlacement = {
      placementId: placement.id,
      learnerId: placement.learner_id,
      learnerName: learner.first_name || "Learner",
      weekday: placement.weekday,
      academyTableId: placement.academy_table_id,
      tableNumber: placement.table_number,
      seatNumber: null,
      startsAt: placement.starts_at.slice(0, 5),
      durationMinutes: placement.duration_minutes,
      teacherName: placement.teacher_name,
      focus: placement.focus,
      pricePlanId: placement.session_price_plan_id,
      pricePlanName: plan.name,
      priceCents: plan.price_cents,
    }
    const list = placementsByParent.get(learner.parent_lead_id) || []
    list.push(item)
    placementsByParent.set(learner.parent_lead_id, list)
  }

  const casesBySource = new Map(
    (cases || []).map((item) => [
      `${item.parent_lead_id}:${item.source_payment_entitlement_id}`,
      item,
    ]),
  )

  const groups = new Map<string, RenewalWorkflowRow>()
  for (const item of entitlements || []) {
    const learner = relation(item.learners)
    const parent = learner ? relation(learner.parent_leads) : null
    if (!learner || !parent || !learner.parent_lead_id) continue

    const key = `${learner.parent_lead_id}:${item.payment_entitlement_id}`
    const existing = groups.get(key)
    if (existing) {
      existing.learnerNames.push(learner.first_name || "Learner")
      const actualLast = latestDatedSeatByLearner.get(learner.id)
      if (actualLast && actualLast > existing.lastPaidServiceDate) {
        existing.lastPaidServiceDate = actualLast
      }
      continue
    }

    const renewal = casesBySource.get(key)
    const rawSessions = Array.isArray(renewal?.selected_sessions)
      ? renewal.selected_sessions
      : []
    const structuredSessions = rawSessions.filter(isStructuredSession)
    const legacySessions = rawSessions
      .filter(isLegacySession)
      .map((session: any) => ({
        date: session.date,
        startsAt: session.startsAt,
        priceCents: session.priceCents,
      }))

    groups.set(key, {
      sourcePaymentEntitlementId: item.payment_entitlement_id,
      parentLeadId: learner.parent_lead_id,
      parentName: parent.parent_name,
      email: parent.email,
      learnerNames: [learner.first_name || "Learner"],
      periodEnd: item.period_end,
      lastPaidServiceDate:
        latestDatedSeatByLearner.get(learner.id) || item.period_end,
      caseId: renewal?.id || null,
      status:
        renewal?.status ||
        (item.period_end < iso(today) ? "overdue" : "ready_to_send"),
      emailSentAt: renewal?.email_sent_at || null,
      proposedPeriodStart: renewal?.proposed_period_start || null,
      proposedPeriodEnd: renewal?.proposed_period_end || null,
      proposedAmountCents: renewal?.proposed_amount_cents || null,
      proposedServiceDates: Array.isArray(renewal?.proposed_service_dates)
        ? renewal.proposed_service_dates.filter(
            (value: unknown): value is string => typeof value === "string",
          )
        : [],
      selectedSessions: structuredSessions,
      legacySelectedSessions: legacySessions,
      placements: placementsByParent.get(learner.parent_lead_id) || [],
      closures: academyClosures,
      draftSubject: renewal?.draft_subject || null,
      draftBody: renewal?.draft_body || null,
      provisionalDeliveryUntil: renewal?.provisional_delivery_until || null,
    })
  }

  const rows = [...groups.values()].sort((a, b) =>
    a.lastPaidServiceDate.localeCompare(b.lastPaidServiceDate),
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="border-b pb-6">
        <p className="text-sm font-semibold text-muted-foreground">
          Protect continuity without mixing it into new-family sales
        </p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Renewals</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Build the next paid period from exact service dates, review the
          editable parent email, then activate those same dated Operations seats
          only after cleared funds are manually confirmed.
        </p>
      </div>

      <div className="grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            In renewal queue
          </p>
          <p className="mt-1 text-2xl font-bold">{rows.length}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Awaiting cleared funds
          </p>
          <p className="mt-1 text-2xl font-bold">
            {rows.filter((row) => row.status === "awaiting_payment").length}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Continuity
          </p>
          <p className="mt-1 text-sm font-semibold">
            Payment-pending attendance remains explicit and date-bounded
          </p>
        </div>
      </div>

      <section className="border-t pt-6">
        <h3 className="text-xl font-bold tracking-tight">Renewal queue</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Each learner keeps their active table and time by default. Seats are not reserved by an unpaid renewal; capacity is allocated from the dated Operations session only when payment clears (or when staff explicitly enable payment-pending continuation). Academy closures are visibly blocked, replacement dates are explicit, and changing a price plan never moves a learner between groups.
        </p>
        <div className="mt-5">
          {rows.length ? (
            <RenewalWorkflowTable
              pricePlans={pricePlans || []}
              rows={rows}
            />
          ) : (
            <p className="border-y py-5 text-sm text-muted-foreground">
              Nothing needs a renewal conversation in the current queue.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
