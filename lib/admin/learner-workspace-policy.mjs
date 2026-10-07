const teachingTabs = [
  { key: "workspace", label: "Workspace" },
  { key: "attendance", label: "Attendance" },
  { key: "teaching-history", label: "Teaching history" },
]

const adminTabs = [
  { key: "family-place", label: "Family & place" },
  { key: "communications", label: "Communications" },
]

export function learnerTabsForRole(role) {
  return role === "admin" ? [...teachingTabs, ...adminTabs] : teachingTabs
}

export function canEditLearnerProfile(role) {
  return role === "admin" || role === "teacher"
}

export function canChangeLearnerStatus(role) {
  return role === "admin"
}
