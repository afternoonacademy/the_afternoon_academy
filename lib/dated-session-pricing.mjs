// Postgres stores period amounts in signed 32-bit integer columns.
export const MAX_SESSION_PRICE_CENTS = 1_000_000

export function parseSessionPrice(value) {
  if (typeof value !== "string") return null
  const match = /^(\d{1,5})(?:[.,](\d{1,2}))?$/.exec(value.trim())
  if (!match) return null
  const cents = Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"))
  return cents <= MAX_SESSION_PRICE_CENTS ? cents : null
}

export function datedSessionPrice(edited, saved, plan) {
  if (saved && saved.pricePlanId === edited.pricePlanId && saved.priceCents === edited.priceCents) {
    return { pricePlanId: saved.pricePlanId, pricePlanName: saved.pricePlanName, priceCents: saved.priceCents }
  }
  if (!plan) throw new Error("Choose an active service for this dated session")
  return { pricePlanId: plan.id, pricePlanName: plan.name, priceCents: edited.priceCents }
}

export function seatServiceNames(date, payments) {
  const labels = new Map()
  for (const payment of payments) {
    for (const session of Array.isArray(payment.selected_sessions) ? payment.selected_sessions : []) {
      if (session?.date === date && session.academyTableId &&
          typeof session.startsAt === "string" && typeof session.pricePlanName === "string") {
        const key = seatServiceKey(payment.learner_id, session.academyTableId, session.startsAt)
        if (!labels.has(key)) labels.set(key, session.pricePlanName)
      }
    }
  }
  return labels
}

export function seatServiceKey(learnerId, tableId, startsAt) {
  return [learnerId, tableId, startsAt.slice(0, 5)].join(":")
}

export function plannedBookingRevision(bookings) {
  return JSON.stringify(bookings.map((booking) => [booking.id, booking.updated_at, booking.status]).sort((a, b) => a[0].localeCompare(b[0])))
}
