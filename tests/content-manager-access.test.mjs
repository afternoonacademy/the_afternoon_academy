import test from "node:test"
import assert from "node:assert/strict"
import { roleHasCapability } from "../lib/auth/capabilities.mjs"
import { navigationForRole } from "../lib/admin/admin-navigation.mjs"
import { capabilityForAdminPath } from "../lib/admin/admin-route-policy.mjs"

test("Content Manager is visible to Admin only",()=>{
  assert.equal(navigationForRole("admin").some(item=>item.href==="/admin/content"),true)
  assert.equal(navigationForRole("teacher").some(item=>item.href==="/admin/content"),false)
  assert.equal(navigationForRole("parent").some(item=>item.href==="/admin/content"),false)
})
test("Content Manager route resolves to existing Admin-only manage_setup capability",()=>{
  assert.equal(capabilityForAdminPath("/admin/content"),"manage_setup")
  assert.equal(capabilityForAdminPath("/admin/content/example"),"manage_setup")
  assert.equal(roleHasCapability("admin","manage_setup"),true)
  assert.equal(roleHasCapability("teacher","manage_setup"),false)
})
