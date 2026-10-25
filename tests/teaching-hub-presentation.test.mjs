import assert from "node:assert/strict"
import test from "node:test"

import {
  canEditTeachingFrameworks,
  frameworksVisibleToRole,
} from "../lib/teaching/framework-presentation.mjs"

const rows = [
  { id: "1", status: "published" },
  { id: "2", status: "draft" },
  { id: "3", status: "archived" },
]

test("teacher sees published frameworks only", () => {
  assert.deepEqual(
    frameworksVisibleToRole(rows, "teacher").map((item) => item.id),
    ["1"],
  )
})

test("admin sees all framework statuses", () => {
  assert.deepEqual(
    frameworksVisibleToRole(rows, "admin").map((item) => item.id),
    ["1", "2", "3"],
  )
})

test("only admin may edit framework definitions", () => {
  assert.equal(canEditTeachingFrameworks("teacher"), false)
  assert.equal(canEditTeachingFrameworks("admin"), true)
})
