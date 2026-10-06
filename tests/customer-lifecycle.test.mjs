import test from "node:test"
import assert from "node:assert/strict"

import { shouldShowActiveCustomer } from "../lib/admin/customer-lifecycle.mjs"

test("active paid learner with upcoming standing placement appears in Customers", () => {
  assert.equal(
    shouldShowActiveCustomer({
      learnerStatus: "active",
      hasPaidEntitlement: true,
      hasCurrentOrUpcomingPlacement: true,
      isInRenewal: false,
      hasClosedRenewal: false,
    }),
    true,
  )
})

test("active learner without a current or upcoming placement stays out of Customers", () => {
  assert.equal(
    shouldShowActiveCustomer({
      learnerStatus: "active",
      hasPaidEntitlement: true,
      hasCurrentOrUpcomingPlacement: false,
      isInRenewal: false,
      hasClosedRenewal: false,
    }),
    false,
  )
})

test("renewal learner remains out of Customers", () => {
  assert.equal(
    shouldShowActiveCustomer({
      learnerStatus: "active",
      hasPaidEntitlement: true,
      hasCurrentOrUpcomingPlacement: true,
      isInRenewal: true,
      hasClosedRenewal: false,
    }),
    false,
  )
})
