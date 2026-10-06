export const adminRoutePolicies = [
  { prefix: "/admin/finance", capability: "view_commercial_kpis" },
  { prefix: "/admin/operations", capability: "view_operations" },
  { prefix: "/admin/leads", capability: "view_family_pipeline" },
  { prefix: "/admin/families", capability: "view_family_pipeline" },
  { prefix: "/admin/family-updates", capability: "view_family_updates" },
  { prefix: "/admin/tutor-room", capability: "manage_tutor_room" },
  { prefix: "/admin/setup", capability: "manage_setup" },
  { prefix: "/admin/payments", capability: "manage_payments" },
  { prefix: "/admin/renewals", capability: "manage_renewals" },
  { prefix: "/admin/place-offers", capability: "manage_payments" },
  { prefix: "/admin/business", capability: "view_commercial_kpis" },
  { prefix: "/admin/trends", capability: "view_commercial_kpis" },
  { prefix: "/admin/learners", capability: "view_learners" },
  { prefix: "/admin", capability: "view_operations" },
]

export function capabilityForAdminPath(pathname) {
  const match = adminRoutePolicies.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(prefix + "/"),
  )
  return match?.capability || null
}
