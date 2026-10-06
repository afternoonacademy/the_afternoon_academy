import assert from "node:assert/strict"
import test from "node:test"

import {
  capabilitiesForRole,
  internalCapabilities,
  roleHasCapability,
} from "../lib/auth/capabilities.mjs"
import { navigationForRole } from "../lib/admin/admin-navigation.mjs"

test("capability map keeps admin complete and teacher deliberately narrow", () => {
  assert.deepEqual(capabilitiesForRole("admin"), internalCapabilities)
  assert.deepEqual(capabilitiesForRole("teacher"), [
    "view_operations",
    "operate_sessions",
    "view_learners",
    "edit_learning_record",
  ])
  assert.deepEqual(capabilitiesForRole("parent"), [])
  assert.deepEqual(capabilitiesForRole(null), [])
  assert.equal(roleHasCapability("teacher", "view_commercial_kpis"), false)
})

test("teacher navigation contains only operations and learner records", () => {
  assert.deepEqual(
    navigationForRole("teacher").map((item) => item.href),
    ["/admin/operations", "/admin/learners"],
  )
  assert.deepEqual(
    navigationForRole("admin").map((item) => item.href),
    [
      "/admin/finance",
      "/admin/operations",
      "/admin/leads",
      "/admin/learners",
      "/admin/family-updates",
      "/admin/tutor-room",
      "/admin/setup",
    ],
  )
})
