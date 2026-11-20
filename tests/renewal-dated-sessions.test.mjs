import assert from "node:assert/strict"
import test from "node:test"
import { matchesCurrentRenewalPlace, resolveRenewalDate } from "../lib/admin/renewal-dated-sessions.mjs"

const learnerId = "synthetic-learner"
const placement = {
  placementId: "standing",
  learnerId,
  learnerName: "Example",
  startsAt: "16:45:00",
  weekday: 4,
  academyTableId: "table-one",
  tableNumber: 1,
  effectiveFrom: "2026-12-02",
  effectiveTo: null,
}
const previous = {
  placementId: placement.placementId,
  learnerId,
  date: "2026-12-04",
  academyTableId: placement.academyTableId,
  tableNumber: placement.tableNumber,
  startsAt: "17:00",
  actualStartsAt: "17:05",
  seatNumber: null,
  replacement: true,
  sessionOrigin: "replacement",
  pricePlanId: "homework",
  pricePlanName: "Homework",
  priceCents: 2500,
}
const plan = { id: "private", name: "Private Support", price_cents: 4000 }
const submitted = { ...previous, pricePlanId: plan.id, priceCents: 3500 }

test("renewal accepts a commercial edit to a saved slot after the standing time moved", () => {
  assert.equal(matchesCurrentRenewalPlace(previous, placement), false)
  const saved = resolveRenewalDate({ submitted, placement, saved: previous, learnerId, plan })
  assert.deepEqual(saved, { ...previous, pricePlanId: "private", pricePlanName: "Private Support", priceCents: 3500 })
})

test("renewal does not allow a new stale slot or altered times to use the saved-slot exception", () => {
  const cases = [
    { submitted: { ...submitted, date: "2026-12-11" }, saved: previous },
    { submitted: { ...submitted, startsAt: "18:00" }, saved: previous },
    { submitted, saved: undefined },
    { submitted, saved: { ...previous, learnerId: "different-learner" } },
  ]
  for (const item of cases) {
    assert.throws(() => resolveRenewalDate({ placement, learnerId, plan, ...item }), /new date does not match/)
  }
  const result = resolveRenewalDate({ submitted: { ...submitted, actualStartsAt: "18:00" }, saved: previous, placement, learnerId, plan })
  assert.equal(result.actualStartsAt, "17:05")
})

test("renewal accepts a new matching slot and preserves its dated price and time override", () => {
  const current = { ...submitted, date: "2026-12-10", startsAt: "16:45", replacement: false, timeTbc: true }
  const saved = resolveRenewalDate({ submitted: current, placement, learnerId, plan })
  assert.equal(saved.priceCents, 3500)
  assert.equal(saved.sessionOrigin, "recurring")
  assert.equal(saved.actualStartsAt, undefined)
  assert.equal(saved.timeTbc, true)
})
