import test from "node:test"
import assert from "node:assert/strict"

import {
  RENEWAL_WINDOW_DAYS,
  isRenewalDue,
  isRenewalWindowOpen,
  renewalWindowOpensOn,
  shouldShowRenewal,
} from "../lib/admin/renewal-eligibility.mjs"

test("renewal action window opens 10 days before the paid-through date", () => {
  assert.equal(RENEWAL_WINDOW_DAYS, 10)
  assert.equal(renewalWindowOpensOn("2026-10-29"), "2026-10-19")
  assert.equal(isRenewalWindowOpen("2026-10-29", "2026-10-18"), false)
  assert.equal(isRenewalWindowOpen("2026-10-29", "2026-10-19"), true)
})

test("renewal action window works across month and year boundaries", () => {
  assert.equal(renewalWindowOpensOn("2027-01-05"), "2026-12-26")
})

test("learner remains visible when an open renewal case already exists", () => {
  assert.equal(
    shouldShowRenewal({
      periodEnd: "2026-11-20",
      today: "2026-10-25",
      hasOpenCase: true,
    }),
    true,
  )
})

test("learner stays out before the window when no renewal case exists", () => {
  assert.equal(
    shouldShowRenewal({
      periodEnd: "2026-11-20",
      today: "2026-10-25",
      hasOpenCase: false,
    }),
    false,
  )
})

test("paid-through due boundary remains separate from early planning", () => {
  assert.equal(isRenewalDue("2026-10-29", "2026-10-25"), false)
  assert.equal(isRenewalDue("2026-10-29", "2026-10-29"), true)
  assert.equal(isRenewalDue("2026-10-29", "2026-10-30"), true)
})
