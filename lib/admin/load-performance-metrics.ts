import { groupCustomerFamilies } from "@/lib/admin/family-customers.mjs"
import {
  calculatePerformanceMetrics,
  performancePeriod,
} from "@/lib/admin/performance-metrics.mjs"
import { shouldShowActiveCustomer } from "@/lib/admin/customer-lifecycle.mjs"
import { supabaseAdmin } from "@/lib/supabase/admin"

function relation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

export async function loadPerformanceMetrics({
  periodKey,
  today,
}: {
  periodKey: string
  today: string
}) {
  const period = performancePeriod(periodKey, new Date(today + "T12:00:00Z"))

  const [
    { data: payments },
    { data: standingPlacements },
    { data: weeklyTemplates },
    { data: academyTables },
    { data: pendingBookings },
    { data: renewalCases },
    { data: learners },
    { data: paidEntitlements },
  ] = await Promise.all([
    supabaseAdmin
      .from("payment_entitlements")
      .select("id,parent_lead_id,amount_cents,status,received_at")
      .eq("status", "paid")
      .gte("received_at", period.start + "T00:00:00Z")
      .lte("received_at", period.end + "T23:59:59.999Z"),
    supabaseAdmin
      .from("standing_placements")
      .select("learner_id,weekday,academy_table_id,table_number,starts_at,status,effective_from,effective_to")
      .eq("status", "active"),
    supabaseAdmin
      .from("weekly_table_templates")
      .select("academy_table_id,status,effective_from,effective_to")
      .eq("status", "active"),
    supabaseAdmin
      .from("academy_tables")
      .select("id,seat_capacity,status")
      .eq("status", "active"),
    supabaseAdmin
      .from("accepted_bookings")
      .select("child_lead_id,status,planned_period_start,planned_period_end,planned_amount_cents")
      .in("status", ["session_planned", "contacted", "accepted_awaiting_payment"]),
    supabaseAdmin
      .from("renewal_cases")
      .select("learner_id,status"),
    supabaseAdmin
      .from("learners")
      .select("id,first_name,year_group,status,parent_lead_id,parent_leads(parent_name,email)")
      .order("first_name"),
    supabaseAdmin
      .from("child_payment_entitlements")
      .select("payment_entitlement_id,learner_id,period_end,status,selected_sessions")
      .eq("status", "paid"),
  ])

  const paymentIds = (payments || []).map((payment) => payment.id)
  const periodChildEntitlements = paymentIds.length
    ? (paidEntitlements || []).filter((item) =>
        paymentIds.includes(item.payment_entitlement_id),
      )
    : []

  const paidThroughByLearner = new Map<string, string>()
  for (const entitlement of paidEntitlements || []) {
    const current = paidThroughByLearner.get(entitlement.learner_id)
    if (!current || entitlement.period_end > current) {
      paidThroughByLearner.set(entitlement.learner_id, entitlement.period_end)
    }
  }

  const placesByLearner = new Map<string, string[]>()
  for (const placement of standingPlacements || []) {
    if (placement.effective_to && placement.effective_to < today) continue
    const current = placesByLearner.get(placement.learner_id) || []
    current.push(
      [placement.weekday, placement.table_number, String(placement.starts_at).slice(0, 5)].join(" · "),
    )
    placesByLearner.set(placement.learner_id, current)
  }

  const openRenewalLearnerIds = new Set(
    (renewalCases || [])
      .filter((item) =>
        ["ready_to_send", "awaiting_payment", "overdue"].includes(item.status),
      )
      .map((item) => item.learner_id)
      .filter(Boolean),
  )
  const closedRenewalLearnerIds = new Set(
    (renewalCases || [])
      .filter((item) => item.status === "not_renewing")
      .map((item) => item.learner_id)
      .filter(Boolean),
  )

  const eligibleCustomerRows = (learners || [])
    .filter((learner) =>
      shouldShowActiveCustomer({
        learnerStatus: learner.status,
        hasPaidEntitlement: paidThroughByLearner.has(learner.id),
        hasCurrentOrUpcomingPlacement:
          (placesByLearner.get(learner.id)?.length || 0) > 0,
        isInRenewal: openRenewalLearnerIds.has(learner.id),
        hasClosedRenewal: closedRenewalLearnerIds.has(learner.id),
      }),
    )
    .map((learner) => {
      const parent = relation(learner.parent_leads)
      return {
        parentLeadId: learner.parent_lead_id,
        learnerId: learner.id,
        learnerName: learner.first_name,
        parentName: parent?.parent_name || "Family",
        email: parent?.email || "—",
        yearGroup: learner.year_group,
        paidThrough: paidThroughByLearner.get(learner.id) || null,
        placeSummary: placesByLearner.get(learner.id)?.join(" · ") || "Recurring place",
      }
    })

  const customers = groupCustomerFamilies(eligibleCustomerRows)

  return {
    period,
    metrics: calculatePerformanceMetrics({
      period,
      payments: payments || [],
      childEntitlements: periodChildEntitlements,
      standingPlacements: standingPlacements || [],
      weeklyTemplates: weeklyTemplates || [],
      academyTables: academyTables || [],
      pendingBookings: pendingBookings || [],
      renewalCases: renewalCases || [],
      activeFamilyCount: customers.familyCount,
      activeLearnerCount: customers.learnerCount,
      today,
    }),
  }
}
