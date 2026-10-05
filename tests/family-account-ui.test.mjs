import test from "node:test"
import assert from "node:assert/strict"

import {
  canPreviewSessionChange,
  canSubmitFamilyBalanceAction,
} from "../lib/admin/family-account-ui.mjs"

test("family balance action is not armed on initial page load", () => {
  assert.equal(
    canSubmitFamilyBalanceAction({
      actionType: "",
      learnerId: "",
      amountEuros: "",
    }),
    false,
  )
})

test("family balance action requires deliberate action, child and amount", () => {
  assert.equal(
    canSubmitFamilyBalanceAction({
      actionType: "apply_to_renewal",
      learnerId: "",
      amountEuros: "15",
    }),
    false,
  )
  assert.equal(
    canSubmitFamilyBalanceAction({
      actionType: "apply_to_renewal",
      learnerId: "learner-1",
      amountEuros: "15",
    }),
    true,
  )
})

test("session change preview stays inactive until destination and rate are chosen", () => {
  assert.equal(
    canPreviewSessionChange({ templateId: "", planId: "" }),
    false,
  )
  assert.equal(
    canPreviewSessionChange({ templateId: "slot-1", planId: "" }),
    false,
  )
  assert.equal(
    canPreviewSessionChange({ templateId: "slot-1", planId: "plan-1" }),
    true,
  )
})
