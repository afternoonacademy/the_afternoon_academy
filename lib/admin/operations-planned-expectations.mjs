const activeStatuses = new Set([
  "session_planned",
  "contacted",
  "accepted_awaiting_payment",
])

export function plannedSeatExpectationsForDate(bookings, date) {
  const expected = []

  for (const booking of bookings || []) {
    if (!activeStatuses.has(booking.status)) continue

    const sessions = Array.isArray(booking.plannedSessions)
      ? booking.plannedSessions
      : []

    for (const session of sessions) {
      if (!session || session.date !== date) continue
      if (
        !session.academyTableId ||
        !session.tableNumber ||
        !session.seatNumber ||
        !session.startsAt
      ) {
        continue
      }

      expected.push({
        bookingId: booking.id,
        childLeadId: booking.childLeadId,
        childName: booking.childName || "Child",
        yearGroup: booking.yearGroup || null,
        academyTableId: session.academyTableId,
        tableNumber: session.tableNumber,
        seatNumber: session.seatNumber,
        startsAt: String(session.startsAt).slice(0, 5),
        durationMinutes: session.durationMinutes || 50,
        focus: session.focus || null,
        status: "planned",
      })
    }
  }

  return expected
}
