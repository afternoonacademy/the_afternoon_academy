export const internalCapabilities = [
  "view_operations",
  "operate_sessions",
  "view_learners",
  "edit_learning_record",
  "view_teaching_hub",
  "manage_teaching_frameworks",
  "view_family_pipeline",
  "edit_preconversion_leads",
  "view_family_updates",
  "manage_tutor_room",
  "manage_setup",
  "manage_payments",
  "manage_renewals",
  "view_commercial_kpis",
  "destructive_admin_actions",
]

const roleCapabilities = {
  admin: internalCapabilities,
  teacher: [
    "view_operations",
    "operate_sessions",
    "view_learners",
    "edit_learning_record",
    "view_teaching_hub",
  ],
  parent: [],
}

export function capabilitiesForRole(role) {
  return [...(roleCapabilities[role] || [])]
}

export function roleHasCapability(role, capability) {
  return capabilitiesForRole(role).includes(capability)
}
