import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { manualLeadSchema } from "../lib/leads/manual-lead.mjs"
import { preconversionLeadEditSchema, buildPreconversionLeadUpdates } from "../lib/admin/preconversion-lead-edit.mjs"
import { hourlySlots, isEnquiryTime, retainTimesForDays, missingTimeGroups, formatEnquiryTime } from "../lib/leads/enquiry-options.mjs"
import { operationsSessionTimes, deliveryAllocationTime } from "../lib/admin/operations-session-times.mjs"
import { calculatePerformanceMetrics } from "../lib/admin/performance-metrics.mjs"

test("weekend demand has 24 hourly choices separately scoped to Saturday and Sunday", () => {
  assert.equal(hourlySlots.length, 24)
  assert.equal(hourlySlots[0], "00:00-01:00")
  assert.equal(hourlySlots[23], "23:00-24:00")
  for (const day of ["saturday", "sunday"]) for (const slot of hourlySlots) assert.equal(isEnquiryTime(`${day}@${slot}`), true)
  assert.equal(isEnquiryTime("saturday@25:00-26:00"), false)
  assert.equal(isEnquiryTime("monday@09:00-10:00"), false)
  assert.deepEqual(missingTimeGroups(["monday", "saturday", "sunday"], ["17:00-17:50", "saturday@09:00-10:00"]), ["sunday"])
  assert.equal(formatEnquiryTime("saturday@09:00-10:00"), "Saturday: 09:00–10:00")
})

test("deselecting a day removes only that day's preferences", () => {
  const times = ["17:00-17:50", "saturday@09:00-10:00", "sunday@14:00-15:00"]
  assert.deepEqual(retainTimesForDays(["monday", "sunday"], times), [times[0], times[2]])
  assert.deepEqual(retainTimesForDays(["saturday"], times), [times[1]])
  assert.deepEqual(retainTimesForDays([], times), [])
})

test("manual leads can be saved with every user field unknown and completed later", () => {
  const lead = manualLeadSchema.parse({ children: [{}] })
  assert.equal(lead.email, "")
  assert.equal(lead.parentName, "")
  assert.equal(lead.children[0].age, null)
  assert.deepEqual(lead.children[0].preferredDays, [])
  assert.deepEqual(lead.children[0].preferredTimes, [])
  assert.equal(manualLeadSchema.safeParse({ children: [{}], email: "not an email" }).success, false)
  assert.equal(manualLeadSchema.safeParse({ children: [{ age: "" }], source: "whatsapp" }).success, true)
  assert.equal(manualLeadSchema.safeParse({ children: [{ age: "-1" }] }).success, false)
})

test("partial lead edits retain unknown age and email as null, not zero or fake data", () => {
  const parsed = preconversionLeadEditSchema.parse({
    parentLeadId: "11111111-1111-4111-8111-111111111111",
    childLeadId: "22222222-2222-4222-8222-222222222222",
    timetablePreferenceId: "33333333-3333-4333-8333-333333333333",
    childAge: "",
  })
  const updates = buildPreconversionLeadUpdates(parsed)
  assert.equal(updates.child.child_age, null)
  assert.equal(updates.parent.email, null)
  assert.equal(updates.child.first_name, null)
  assert.equal(updates.parent.parent_name, "")
  assert.deepEqual(updates.timetable.preferred_days, [])
})

test("Wednesday is operational and weekends have only configured allocation times", () => {
  assert.deepEqual(operationsSessionTimes({ date: "2026-11-18" }), ["17:00", "18:00"])
  assert.deepEqual(operationsSessionTimes({ date: "2026-11-21" }), [])
  const sessions = [{ id: "s1", starts_at: "10:00:00" }]
  assert.deepEqual(operationsSessionTimes({ date: "2026-11-21", sessions }), ["10:00"])
  assert.equal(deliveryAllocationTime({ delivery_session_id: "s1" }, sessions), "10:00")
  assert.deepEqual(operationsSessionTimes({ date: "2026-11-22", plannedSeats: [{ startsAt: "14:00" }], renewalSeats: [{ startsAt: "09:00" }] }), ["09:00", "14:00"])
  // Actual teaching-time overrides are intentionally not an input to selectors.
  assert.equal(operationsSessionTimes({ date: "2026-11-21", sessions, timeOverrides: [{ actual_starts_at: "11:00" }] }).includes("11:00"), false)
})

test("weekday KPI scope includes Wednesday but excludes weekend capacity and paid sessions", () => {
  const metrics = calculatePerformanceMetrics({
    period: { start: "2026-11-01", end: "2026-11-30" }, today: "2026-11-17",
    payments: [{ id: "p", status: "paid", parent_lead_id: "f", amount_cents: 10000, received_at: "2026-11-14T12:00:00Z" }],
    childEntitlements: [{ payment_entitlement_id: "p", learner_id: "l", selected_sessions: [{ date: "2026-11-18" }, { date: "2026-11-21" }, { date: "2026-11-22" }] }],
    academyTables: [{ id: "t", status: "active", seat_capacity: 6 }],
    weeklyTemplates: [3, 6, 0].map((weekday) => ({ weekday, academy_table_id: "t", status: "active", effective_from: "2026-11-01" })),
    standingPlacements: [3, 6, 0].map((weekday) => ({ weekday, learner_id: "l", academy_table_id: "t", starts_at: "10:00", status: "active", effective_from: "2026-11-01" })),
  })
  assert.equal(metrics.paidSessions, 1)
  assert.equal(metrics.capacityAvailable, 6)
  assert.equal(metrics.capacityUsed, 1)
  assert.equal(metrics.teachingBlocksPerWeek, 1)
  assert.equal(metrics.revenueCents, 10000) // Saturday receipt remains real cash.
})

test("recording a planned place cannot send or log an email", () => {
  const source = readFileSync(new URL("../actions/child-place-planning.ts", import.meta.url), "utf8")
  const planAction = source.split("export async function recordPlannedChildPlace")[1].split("export async function")[0]
  assert.doesNotMatch(planAction, /emails\.send|email_delivery_log/)
  const sendAction = source.split("export async function sendPlannedPlaceEmail")[1]
  assert.ok(sendAction.indexOf("safeParse(freshDraft.to)") < sendAction.indexOf('.from("email_delivery_log")'))
})
