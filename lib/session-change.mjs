export function isSessionChangeable(session, attendanceStatus, today) {
  return Boolean(session?.date && session.date >= today && !attendanceStatus)
}

export function previewSessionChange(before, after) {
  const oldValueCents = before.reduce((sum, item) => sum + item.priceCents, 0)
  const newValueCents = after.reduce((sum, item) => sum + item.priceCents, 0)
  return { oldValueCents, newValueCents, differenceCents: newValueCents - oldValueCents }
}
