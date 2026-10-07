import assert from "node:assert/strict"
import test from "node:test"

import {
  canChangeLearnerStatus,
  canEditLearnerProfile,
  learnerTabsForRole,
} from "../lib/admin/learner-workspace-policy.mjs"

test("teacher sees teaching tabs only", () => {
  assert.deepEqual(
    learnerTabsForRole("teacher").map((item) => item.key),
    ["workspace", "attendance", "teaching-history"],
  )
})

test("admin sees teaching plus family and communications tabs", () => {
  assert.deepEqual(
    learnerTabsForRole("admin").map((item) => item.key),
    ["workspace", "attendance", "teaching-history", "family-place", "communications"],
  )
})

test("teacher can edit profile but not lifecycle status", () => {
  assert.equal(canEditLearnerProfile("teacher"), true)
  assert.equal(canChangeLearnerStatus("teacher"), false)
  assert.equal(canChangeLearnerStatus("admin"), true)
})
