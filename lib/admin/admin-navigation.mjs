import { roleHasCapability } from "../auth/capabilities.mjs"

export const adminNavItems = [
  { href: "/admin", label: "Operations hub", capability: "view_operations" },
  { href: "/admin/leads", label: "Family pipeline", capability: "view_family_pipeline" },
  { href: "/admin/learners", label: "Learner records", capability: "view_learners" },
  { href: "/admin/family-updates", label: "Family updates", capability: "view_family_updates" },
  { href: "/admin/tutor-room", label: "One-to-one room", capability: "manage_tutor_room" },
  { href: "/admin/setup", label: "Academy setup", capability: "manage_setup" },
]

export function navigationForRole(role) {
  return adminNavItems.filter((item) => roleHasCapability(role, item.capability))
}

export const mobileAdminNavigationConfig = {
  side: "left",
  closeOnNavigate: true,
  hideScrollbars: true,
  momentumScrolling: true,
}
