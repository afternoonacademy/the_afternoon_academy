/** @param {{date: string, templates?: Array<{starts_at: string}>, sessions?: Array<{starts_at: string}>, renewalSeats?: Array<{startsAt: string}>, plannedSeats?: Array<{startsAt: string}>}} input */
export function operationsSessionTimes({ date, templates = [], sessions = [], renewalSeats = [], plannedSeats = [] }) {
  const weekday = new Date(date + "T12:00:00Z").getUTCDay()
  const defaults = weekday >= 1 && weekday <= 5 ? ["17:00", "18:00"] : []
  return [...new Set([
    ...defaults,
    ...templates.map((item) => item.starts_at.slice(0, 5)),
    ...sessions.map((item) => item.starts_at.slice(0, 5)),
    ...renewalSeats.map((item) => item.startsAt.slice(0, 5)),
    ...plannedSeats.map((item) => item.startsAt.slice(0, 5)),
  ])].sort()
}

// Dated delivery allocation is authoritative. Per-seat teaching overrides do not move it.
export function deliveryAllocationTime(seat, sessions) {
  return sessions.find((item) => item.id === seat.delivery_session_id)?.starts_at.slice(0, 5) || ""
}
