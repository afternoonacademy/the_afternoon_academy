import assert from "node:assert/strict"
import test from "node:test"

import {
  calculatePerformanceMetrics,
  performancePeriod,
} from "../lib/admin/performance-metrics.mjs"

test("performance periods are deterministic", () => {
  const today = new Date("2026-10-06T10:00:00Z")
  assert.deepEqual(performancePeriod("this_month", today), {
    start: "2026-10-01",
    end: "2026-10-31",
    key: "this_month",
  })
  assert.deepEqual(performancePeriod("last_month", today), {
    start: "2026-09-01",
    end: "2026-09-30",
    key: "last_month",
  })
  assert.deepEqual(performancePeriod("this_year", today), {
    start: "2026-01-01",
    end: "2026-12-31",
    key: "this_year",
  })
})

test("cash, paid sessions, capacity and pending value stay distinct", () => {
  const period = { start: "2026-10-01", end: "2026-10-31" }
  const metrics = calculatePerformanceMetrics({
    period,
    today: "2026-10-06",
    payments: [
      { id: "pay1", parent_lead_id: "p1", amount_cents: 10000, status: "paid", received_at: "2026-10-02T10:00:00Z" },
      { id: "pay2", parent_lead_id: "p2", amount_cents: 9000, status: "pending", received_at: "2026-10-03T10:00:00Z" },
      { id: "pay3", parent_lead_id: "p3", amount_cents: 8000, status: "paid", received_at: "2026-09-30T10:00:00Z" },
    ],
    childEntitlements: [
      { payment_entitlement_id: "pay1", learner_id: "l1", selected_sessions: [{ date: "2026-10-06" }, { date: "2026-10-13" }] },
    ],
    standingPlacements: [
      { learner_id: "l1", weekday: 2, academy_table_id: "t1", starts_at: "17:00:00", status: "active", effective_to: null },
      { learner_id: "l2", weekday: 2, academy_table_id: "t1", starts_at: "17:00:00", status: "active", effective_to: "2026-12-31" },
    ],
    weeklyTemplates: [
      { academy_table_id: "t1", status: "active", effective_from: "2026-09-01", effective_to: null },
    ],
    academyTables: [{ id: "t1", status: "active", seat_capacity: 6 }],
    pendingBookings: [
      { child_lead_id: "c1", status: "contacted", planned_period_start: "2026-10-01", planned_period_end: "2026-10-31", planned_amount_cents: 10000 },
      { child_lead_id: "c1", status: "contacted", planned_period_start: "2026-10-01", planned_period_end: "2026-10-31", planned_amount_cents: 10000 },
      { child_lead_id: "c2", status: "paid_active", planned_amount_cents: 5000 },
    ],
    renewalCases: [{ status: "ready_to_send" }, { status: "renewed" }],
    activeFamilyCount: 3,
    activeLearnerCount: 5,
  })

  assert.equal(metrics.revenueCents, 10000)
  assert.equal(metrics.paidSessions, 2)
  assert.equal(metrics.recurringLearnerSessionsPerWeek, 2)
  assert.equal(metrics.teachingBlocksPerWeek, 1)
  assert.equal(metrics.capacityAvailable, 6)
  assert.equal(metrics.pendingPlannedValueCents, 10000)
  assert.equal(metrics.renewalsDue, 1)
  assert.equal(metrics.averageRevenuePerFamilyCents, 10000)
  assert.equal(metrics.averageRevenuePerLearnerCents, 10000)
})

test("zero denominators return null averages", () => {
  const metrics = calculatePerformanceMetrics({
    period: { start: "2026-10-01", end: "2026-10-31" },
  })
  assert.equal(metrics.averageRevenuePerFamilyCents, null)
  assert.equal(metrics.averageRevenuePerLearnerCents, null)
  assert.equal(metrics.capacityUtilization, null)
})
