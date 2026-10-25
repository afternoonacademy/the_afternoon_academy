import { plannedSeatExpectationsForDate } from "@/lib/admin/operations-planned-expectations.mjs"
import { supabaseAdmin } from "@/lib/supabase/admin"

export type PlannedExpectedSeat = {
  bookingId: string
  childLeadId: string
  childName: string
  yearGroup: string | null
  academyTableId: string
  tableNumber: number
  seatNumber: number
  startsAt: string
  durationMinutes: number
  focus: string | null
  status: "planned"
}

export async function loadPlannedExpectedSeatsForDate({
  date,
  academyClosed,
}: {
  date: string
  academyClosed: boolean
}): Promise<PlannedExpectedSeat[]> {
  if (academyClosed) return []

  const { data: bookings, error } = await supabaseAdmin
    .from("accepted_bookings")
    .select(
      "id,status,child_lead_id,planned_sessions,child_leads(first_name,school_year)",
    )
    .in("status", [
      "session_planned",
      "contacted",
      "accepted_awaiting_payment",
    ])
    .lte("planned_period_start", date)
    .gte("planned_period_end", date)

  if (error) {
    throw new Error("Could not load planned lead seats")
  }

  const normalized = (bookings || []).map((booking) => {
    const child = Array.isArray(booking.child_leads)
      ? booking.child_leads[0]
      : booking.child_leads

    return {
      id: booking.id,
      status: booking.status,
      childLeadId: booking.child_lead_id,
      childName: child?.first_name || "Child",
      yearGroup: child?.school_year || null,
      plannedSessions: Array.isArray(booking.planned_sessions)
        ? booking.planned_sessions
        : [],
    }
  })

  return plannedSeatExpectationsForDate(normalized, date) as PlannedExpectedSeat[]
}
