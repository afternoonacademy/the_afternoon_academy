import { supabaseAdmin } from "@/lib/supabase/admin"

export type RenewalExpectedSeat = {
  learnerId: string
  placementId: string
  academyTableId: string
  tableNumber: number
  seatNumber: number
  startsAt: string
  durationMinutes: number
  teacherName: string | null
  focus: string | null
  status: "renewal_due"
}

type DeliverySession = {
  id: string
  academy_table_id: string
  starts_at: string
}

type DeliverySeat = {
  delivery_session_id: string
  learner_id: string
  seat_number: number
  status: string
}

type AcademyTable = {
  id: string
  seat_capacity: number
}

export async function loadRenewalExpectedSeatsForDate({
  date,
  sessions,
  seats,
  tables,
  academyClosed,
}: {
  date: string
  sessions: DeliverySession[]
  seats: DeliverySeat[]
  tables: AcademyTable[]
  academyClosed: boolean
}): Promise<RenewalExpectedSeat[]> {
  if (academyClosed) return []

  const weekday = new Date(date + "T12:00:00Z").getUTCDay()

  const { data: placements, error: placementError } = await supabaseAdmin
    .from("standing_placements")
    .select(
      "id,learner_id,weekday,academy_table_id,table_number,seat_number,starts_at,duration_minutes,teacher_name,focus,effective_from,effective_to,learners!inner(id,status)",
    )
    .eq("status", "active")
    .eq("weekday", weekday)
    .lte("effective_from", date)
    .or(`effective_to.is.null,effective_to.gte.${date}`)

  if (placementError) {
    throw new Error("Could not load recurring learner expectations")
  }

  const activePlacements = (placements || []).filter((placement) => {
    const learner = Array.isArray(placement.learners)
      ? placement.learners[0]
      : placement.learners
    return learner?.status === "active"
  })

  const learnerIds = [...new Set(activePlacements.map((item) => item.learner_id))]
  if (!learnerIds.length) return []

  const [
    { data: coveringEntitlements, error: entitlementError },
    { data: bookings, error: bookingError },
    { data: closedRenewals, error: renewalError },
  ] = await Promise.all([
    supabaseAdmin
      .from("child_payment_entitlements")
      .select("learner_id")
      .in("learner_id", learnerIds)
      .eq("status", "paid")
      .lte("period_start", date)
      .gte("period_end", date),
    supabaseAdmin
      .from("accepted_bookings")
      .select("learner_id,weekday,academy_table_id,starts_at,seat_number,status")
      .in("learner_id", learnerIds)
      .in("status", [
        "session_planned",
        "contacted",
        "accepted_awaiting_payment",
        "paid_active",
      ]),
    supabaseAdmin
      .from("renewal_cases")
      .select("learner_id")
      .in("learner_id", learnerIds)
      .eq("status", "not_renewing"),
  ])

  if (entitlementError || bookingError || renewalError) {
    throw new Error("Could not verify renewal expectations")
  }

  const paidOnDate = new Set(
    (coveringEntitlements || []).map((item) => item.learner_id),
  )
  const closedLearners = new Set(
    (closedRenewals || [])
      .map((item) => item.learner_id)
      .filter((id): id is string => Boolean(id)),
  )

  const sessionByKey = new Map(
    sessions.map((session) => [
      session.academy_table_id + "|" + session.starts_at.slice(0, 5),
      session,
    ]),
  )

  const occupiedByKey = new Map<string, Set<number>>()
  const actualLearnersByKey = new Map<string, Set<string>>()
  for (const seat of seats) {
    const session = sessions.find(
      (item) => item.id === seat.delivery_session_id,
    )
    if (!session) continue
    const key =
      session.academy_table_id + "|" + session.starts_at.slice(0, 5)
    const occupied = occupiedByKey.get(key) || new Set<number>()
    occupied.add(seat.seat_number)
    occupiedByKey.set(key, occupied)

    const learners = actualLearnersByKey.get(key) || new Set<string>()
    learners.add(seat.learner_id)
    actualLearnersByKey.set(key, learners)
  }

  const capacityByTable = new Map(
    tables.map((table) => [table.id, table.seat_capacity]),
  )

  const bookingSeat = new Map<string, number>()
  for (const booking of bookings || []) {
    if (!booking.learner_id) continue
    const key = [
      booking.learner_id,
      booking.weekday,
      booking.academy_table_id,
      String(booking.starts_at).slice(0, 5),
    ].join("|")
    bookingSeat.set(key, booking.seat_number)
  }

  const expected: RenewalExpectedSeat[] = []
  for (const placement of activePlacements) {
    if (
      paidOnDate.has(placement.learner_id) ||
      closedLearners.has(placement.learner_id)
    ) {
      continue
    }

    const startsAt = placement.starts_at.slice(0, 5)
    const key = placement.academy_table_id + "|" + startsAt
    const actualLearners = actualLearnersByKey.get(key)
    if (actualLearners?.has(placement.learner_id)) continue

    const capacity = capacityByTable.get(placement.academy_table_id) || 0
    if (!capacity) continue

    const occupied = occupiedByKey.get(key) || new Set<number>()
    const bookingKey = [
      placement.learner_id,
      placement.weekday,
      placement.academy_table_id,
      startsAt,
    ].join("|")
    const preferredSeat =
      bookingSeat.get(bookingKey) ?? placement.seat_number ?? null

    let seatNumber: number | null = null
    if (
      preferredSeat &&
      preferredSeat <= capacity &&
      !occupied.has(preferredSeat)
    ) {
      seatNumber = preferredSeat
    } else {
      for (let seat = 1; seat <= capacity; seat += 1) {
        if (!occupied.has(seat)) {
          seatNumber = seat
          break
        }
      }
    }

    if (!seatNumber) continue

    occupied.add(seatNumber)
    occupiedByKey.set(key, occupied)

    expected.push({
      learnerId: placement.learner_id,
      placementId: placement.id,
      academyTableId: placement.academy_table_id,
      tableNumber: placement.table_number,
      seatNumber,
      startsAt,
      durationMinutes: placement.duration_minutes,
      teacherName: placement.teacher_name,
      focus: placement.focus,
      status: "renewal_due",
    })
  }

  return expected
}
