import test from "node:test"
import assert from "node:assert/strict"

import {
  initialPlanSessionOrigin,
  customerFacingSessionSuffix,
} from "../lib/initial-plan-exceptions.mjs"

test("off-pattern date in an initial plan is a pre-agreed exception", () => {
  assert.equal(initialPlanSessionOrigin(true), "pre_agreed_exception")
})

test("normal recurring date in an initial plan stays recurring", () => {
  assert.equal(initialPlanSessionOrigin(false), "recurring")
})

test("pre-agreed first-period exceptions are not labelled replacement to parents", () => {
  assert.equal(
    customerFacingSessionSuffix({
      sessionOrigin: "pre_agreed_exception",
      replacement: true,
    }),
    "",
  )
})

test("legacy post-agreement replacement still displays replacement", () => {
  assert.equal(
    customerFacingSessionSuffix({ replacement: true }),
    " · replacement",
  )
})
