export function frameworksVisibleToRole(frameworks, role) {
  const rows = Array.isArray(frameworks) ? frameworks : []
  return role === "admin"
    ? rows
    : rows.filter((item) => item.status === "published")
}

export function canEditTeachingFrameworks(role) {
  return role === "admin"
}
