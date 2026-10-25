import assert from "node:assert/strict"
import test from "node:test"

import { capabilityForAdminPath } from "../lib/admin/admin-route-policy.mjs"
import { roleHasCapability } from "../lib/auth/capabilities.mjs"

test("admin route policy assigns server-side capabilities", () => {
  assert.equal(capabilityForAdminPath("/admin"), "view_operations")
  assert.equal(capabilityForAdminPath("/admin/learners"), "view_learners")
  assert.equal(capabilityForAdminPath("/admin/learners/abc"), "view_learners")
  assert.equal(capabilityForAdminPath("/admin/leads"), "view_family_pipeline")
  assert.equal(capabilityForAdminPath("/admin/setup"), "manage_setup")
  assert.equal(capabilityForAdminPath("/admin/business"), "view_commercial_kpis")
})

test("teacher cannot satisfy commercial or pipeline routes", () => {
  assert.equal(roleHasCapability("teacher", capabilityForAdminPath("/admin")), true)
  assert.equal(roleHasCapability("teacher", capabilityForAdminPath("/admin/learners")), true)
  assert.equal(roleHasCapability("teacher", capabilityForAdminPath("/admin/leads")), false)
  assert.equal(roleHasCapability("teacher", capabilityForAdminPath("/admin/setup")), false)
  assert.equal(roleHasCapability("parent", capabilityForAdminPath("/admin")), false)
})
