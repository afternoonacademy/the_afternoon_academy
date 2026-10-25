import assert from "node:assert/strict"
import test from "node:test"

import { groupCustomerFamilies } from "../lib/admin/family-customers.mjs"

const row = (parentLeadId, learnerId, learnerName) => ({
  parentLeadId,
  learnerId,
  learnerName,
  parentName: parentLeadId ? `Parent ${parentLeadId}` : "Unknown",
  email: parentLeadId ? `${parentLeadId}@example.com` : "—",
  yearGroup: "7",
  paidThrough: "2026-10-31",
  placeSummary: "Tue · 17:00",
})

test("siblings count as one customer family and two active learners", () => {
  const result = groupCustomerFamilies([
    row("p1", "l1", "Alba"),
    row("p1", "l2", "Hugo"),
  ])
  assert.equal(result.familyCount, 1)
  assert.equal(result.learnerCount, 2)
  assert.deepEqual(result.families[0].children.map((child) => child.learnerName), ["Alba", "Hugo"])
})

test("three families with five eligible learners counts correctly", () => {
  const result = groupCustomerFamilies([
    row("p1", "l1", "A"),
    row("p1", "l2", "B"),
    row("p2", "l3", "C"),
    row("p3", "l4", "D"),
    row("p3", "l5", "E"),
  ])
  assert.equal(result.familyCount, 3)
  assert.equal(result.learnerCount, 5)
})

test("orphan rows never merge unrelated learners", () => {
  const result = groupCustomerFamilies([
    row(null, "l1", "A"),
    row(null, "l2", "B"),
  ])
  assert.equal(result.familyCount, 2)
})
