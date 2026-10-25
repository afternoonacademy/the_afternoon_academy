import assert from "node:assert/strict"
import test from "node:test"

import {
  shouldCountActiveCustomer,
  shouldShowActiveCustomer,
} from "../lib/admin/customer-lifecycle.mjs"

test("renewal learners leave the paid-customer queue but remain active customers", () => {
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

  assert.equal(
    shouldCountActiveCustomer({
      learnerStatus: "active",
      hasCurrentOrUpcomingPlacement: true,
      hasClosedRenewal: false,
    }),
    true,
  )
})

test("released or closed learners are not active customers", () => {
  assert.equal(
    shouldCountActiveCustomer({
      learnerStatus: "active",
      hasCurrentOrUpcomingPlacement: false,
      hasClosedRenewal: false,
    }),
    false,
  )

  assert.equal(
    shouldCountActiveCustomer({
      learnerStatus: "active",
      hasCurrentOrUpcomingPlacement: true,
      hasClosedRenewal: true,
    }),
    false,
  )
})
