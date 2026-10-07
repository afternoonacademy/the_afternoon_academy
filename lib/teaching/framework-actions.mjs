export function canManageTeachingFrameworks(capabilities) {
  return Array.isArray(capabilities) && capabilities.includes("manage_teaching_frameworks")
}

export function nextFrameworkVersionNumber(versions) {
  return Math.max(
    0,
    ...(versions || []).map((item) => Number(item.version_number) || 0),
  ) + 1
}

export function prepareFrameworkPublish() {
  return { status: "published" }
}
