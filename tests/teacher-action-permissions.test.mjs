import assert from "node:assert/strict"
import test from "node:test"

import { capabilityForTeachingAction } from "../lib/admin/teacher-action-policy.mjs"
import { roleHasCapability } from "../lib/auth/capabilities.mjs"

test("teacher-safe action policy is explicit", () => {
  for (const action of [
    "recordAttendance",
    "recordRenewalExpectedAttendance",
    "createTeacherUpdate",
    "createLearnerGoal",
    "updateLearnerGoalStatus",
    "updateLearnerPersonalProfile",
    "addDeliverySeat",
    "addAdhocDeliverySeat",
    "updateDailyDeliverySession",
  ]) {
    assert.equal(roleHasCapability("teacher", capabilityForTeachingAction(action)), true)
  }

  for (const action of [
    "createLearner",
    "updateLearnerDetails",
    "removeDeliverySeat",
    "cancelDeliverySession",
    "recordPaymentEntitlement",
    "saveStandingPlacement",
  ]) {
    const capability = capabilityForTeachingAction(action)
    assert.equal(capability, null)
  }
})
