import test from "node:test"
import assert from "node:assert/strict"

import {
  adminNavItems,
  mobileAdminNavigationConfig,
} from "../lib/admin/admin-navigation.mjs"

test("mobile admin navigation exposes every primary admin destination", () => {
  assert.deepEqual(
    adminNavItems.map((item) => item.href),
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

test("mobile admin navigation uses an iOS-like swipeable drawer without visible scrollbars", () => {
  assert.deepEqual(mobileAdminNavigationConfig, {
    side: "left",
    closeOnNavigate: true,
    hideScrollbars: true,
    momentumScrolling: true,
  })
})
