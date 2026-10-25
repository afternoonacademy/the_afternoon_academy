import assert from "node:assert/strict"
import test from "node:test"

import {
  capabilitiesForRole,
  internalCapabilities,
  roleHasCapability,
} from "../lib/auth/capabilities.mjs"
import { navigationForRole } from "../lib/admin/admin-navigation.mjs"
import { capabilityForAdminPath } from "../lib/admin/admin-route-policy.mjs"

test("capability map keeps admin complete and teacher deliberately narrow", () => {
  assert.deepEqual(capabilitiesForRole("admin"), internalCapabilities)
  assert.deepEqual(capabilitiesForRole("teacher"), [
    "view_operations",
    "operate_sessions",
    "view_learners",
    "edit_learning_record",
    "view_teaching_hub",
  ])
  assert.deepEqual(capabilitiesForRole("parent"), [])
  assert.deepEqual(capabilitiesForRole(null), [])
  assert.equal(roleHasCapability("teacher", "view_commercial_kpis"), false)
  assert.equal(roleHasCapability("teacher", "manage_teaching_frameworks"), false)
  assert.equal(roleHasCapability("admin", "manage_teaching_frameworks"), true)
})

test("teacher navigation contains operations, learner records and teaching hub", () => {
  assert.deepEqual(
    navigationForRole("teacher").map((item) => item.href),
    ["/admin/operations", "/admin/learners", "/admin/teaching"],
  )
  assert.deepEqual(
    navigationForRole("admin").map((item) => item.href),
    [
      "/admin/finance",
      "/admin/operations",
      "/admin/leads",
      "/admin/learners",
      "/admin/teaching",
      "/admin/family-updates",
      "/admin/tutor-room",
      "/admin/setup",
    ],
  )
})

test("teaching hub routes use teaching capabilities", () => {
  assert.equal(capabilityForAdminPath("/admin/teaching"), "view_teaching_hub")
  assert.equal(
    capabilityForAdminPath("/admin/teaching/manage/example"),
    "manage_teaching_frameworks",
  )
})
