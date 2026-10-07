import assert from "node:assert/strict"
import test from "node:test"

import {
  canManageTeachingFrameworks,
  nextFrameworkVersionNumber,
  prepareFrameworkPublish,
} from "../lib/teaching/framework-actions.mjs"

test("only management capability may mutate framework definitions", () => {
  assert.equal(canManageTeachingFrameworks(["view_teaching_hub"]), false)
  assert.equal(canManageTeachingFrameworks(["manage_teaching_frameworks"]), true)
})

test("publishing creates the next immutable version", () => {
  assert.equal(
    nextFrameworkVersionNumber([{ version_number: 1 }, { version_number: 3 }]),
    4,
  )
  assert.deepEqual(prepareFrameworkPublish({ status: "archived" }), {
    status: "published",
  })
})
