import test from "node:test"
import assert from "node:assert/strict"

import { isRenewalDue } from "../lib/admin/renewal-eligibility.mjs"

test("learner remains out of Renewals before the final paid date", () => {
  assert.equal(isRenewalDue("2026-10-26", "2026-10-25"), false)
})

test("learner enters Renewals on the final paid date", () => {
  assert.equal(isRenewalDue("2026-10-26", "2026-10-26"), true)
})

test("learner remains due after the paid period has ended", () => {
  assert.equal(isRenewalDue("2026-10-26", "2026-10-27"), true)
})
