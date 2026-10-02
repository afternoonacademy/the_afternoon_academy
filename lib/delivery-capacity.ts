import type { SupabaseClient } from "@supabase/supabase-js"

import type { PaidPeriodSession } from "@/lib/paid-period"

const ACTIVE_SEAT_STATUSES = ["scheduled", "payment_pending"]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00Z`))
}

function sessionKey(session: PaidPeriodSession) {
  return `${session.date}|${session.academyTableId}|${session.startsAt}`
}

function requestLearnerKey(session: PaidPeriodSession) {
  return session.learnerId || session.childLeadId || session.placementId
}

async function getCapacity(
  supabase: SupabaseClient,
  academyTableId: string,
) {
  const { data, error } = await supabase
    .from("academy_tables")
    .select("seat_capacity,status")
    .eq("id", academyTableId)
    .maybeSingle()

  if (error || !data || data.status !== "active") {
    throw new Error("The selected Academy table is no longer available")
  }

  return data.seat_capacity
}

async function getDeliverySessionId(
  supabase: SupabaseClient,
  session: PaidPeriodSession,
) {
  const { data, error } = await supabase
    .from("delivery_sessions")
    .select("id")
    .eq("service_date", session.date)
    .eq("academy_table_id", session.academyTableId)
    .eq("starts_at", session.startsAt)
    .maybeSingle()

  if (error) throw new Error("Could not check the dated Operations session")
  return data?.id || null
}

export async function assertPaidPeriodCapacity(
  sessions: PaidPeriodSession[],
  supabase: SupabaseClient,
) {
  const groups = new Map<string, PaidPeriodSession[]>()

  for (const session of sessions) {
    const key = sessionKey(session)
    const current = groups.get(key) || []
    current.push(session)
    groups.set(key, current)
  }

  for (const groupedSessions of groups.values()) {
    const sample = groupedSessions[0]
    const capacity = await getCapacity(supabase, sample.academyTableId)
    const deliverySessionId = await getDeliverySessionId(supabase, sample)

    let activeSeats: { learner_id: string; seat_number: number }[] = []
    if (deliverySessionId) {
      const { data, error } = await supabase
        .from("delivery_seats")
        .select("learner_id,seat_number")
        .eq("delivery_session_id", deliverySessionId)
        .in("status", ACTIVE_SEAT_STATUSES)

      if (error) throw new Error("Could not check dated session capacity")
      activeSeats = data || []
    }

    const alreadyAllocatedLearners = new Set(
      activeSeats.map((seat) => seat.learner_id),
    )
    const requestedLearners = new Set(
      groupedSessions.map((session) => requestLearnerKey(session)),
    )
    const requestedExistingLearners = new Set(
      groupedSessions
        .map((session) => session.learnerId)
        .filter(
          (learnerId): learnerId is string =>
            Boolean(learnerId) && alreadyAllocatedLearners.has(learnerId!),
        ),
    )
    const additionalSeats =
      requestedLearners.size - requestedExistingLearners.size

    if (activeSeats.length + additionalSeats > capacity) {
      throw new Error(
        `Table ${sample.tableNumber} at ${sample.startsAt} is full on ${formatDate(sample.date)}. ${activeSeats.length} of ${capacity} places are already allocated. Choose another table/time/date.`,
      )
    }
  }
}

export async function allocateDatedOperationsSeat({
  session,
  learnerId,
  userId,
  status,
  note,
  supabase,
}: {
  session: PaidPeriodSession
  learnerId: string
  userId: string
  status: "scheduled" | "payment_pending"
  note: string | null
  supabase: SupabaseClient
}) {
  const { data: delivery, error: deliveryError } = await supabase
    .from("delivery_sessions")
    .upsert(
      {
        service_date: session.date,
        table_number: session.tableNumber,
        academy_table_id: session.academyTableId,
        starts_at: session.startsAt,
        duration_minutes: session.durationMinutes,
        teacher_name: session.teacherName,
        focus: session.focus,
        status: "scheduled",
        created_by: userId,
        updated_by: userId,
      },
      { onConflict: "service_date,academy_table_id,starts_at" },
    )
    .select("id")
    .single()

  if (deliveryError || !delivery) {
    throw new Error(
      `The Operations session for ${formatDate(session.date)} could not be prepared.`,
    )
  }

  const { data: existingLearnerSeat, error: learnerSeatError } = await supabase
    .from("delivery_seats")
    .select("id,seat_number")
    .eq("delivery_session_id", delivery.id)
    .eq("learner_id", learnerId)
    .in("status", ACTIVE_SEAT_STATUSES)
    .maybeSingle()

  if (learnerSeatError) {
    throw new Error(
      `The learner's Operations place for ${formatDate(session.date)} could not be checked.`,
    )
  }

  if (existingLearnerSeat) {
    const { error: updateError } = await supabase
      .from("delivery_seats")
      .update({
        status,
        note,
        updated_by: userId,
      })
      .eq("id", existingLearnerSeat.id)

    if (updateError) {
      throw new Error(
        `The learner's Operations place for ${formatDate(session.date)} could not be updated.`,
      )
    }

    return existingLearnerSeat.seat_number
  }

  const capacity = await getCapacity(supabase, session.academyTableId)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data: occupiedSeats, error: occupiedError } = await supabase
      .from("delivery_seats")
      .select("seat_number")
      .eq("delivery_session_id", delivery.id)
      .in("status", ACTIVE_SEAT_STATUSES)

    if (occupiedError) {
      throw new Error(
        `Capacity for ${formatDate(session.date)} could not be checked.`,
      )
    }

    const occupied = new Set(
      (occupiedSeats || []).map((item) => item.seat_number),
    )
    let availableSeat: number | null = null
    for (let seat = 1; seat <= capacity; seat += 1) {
      if (!occupied.has(seat)) {
        availableSeat = seat
        break
      }
    }

    if (!availableSeat) {
      throw new Error(
        `Table ${session.tableNumber} at ${session.startsAt} is full on ${formatDate(session.date)}. Choose another table/time/date.`,
      )
    }

    const { error: insertError } = await supabase
      .from("delivery_seats")
      .insert({
        delivery_session_id: delivery.id,
        learner_id: learnerId,
        seat_number: availableSeat,
        status,
        note,
        updated_by: userId,
      })

    if (!insertError) return availableSeat

    if (insertError.code !== "23505" || attempt === 1) {
      console.error("Dated Operations seat allocation failed", {
        insertError,
        deliverySessionId: delivery.id,
        learnerId,
        serviceDate: session.date,
        availableSeat,
      })
      throw new Error(
        `An Operations place for ${formatDate(session.date)} could not be allocated. Check the dated session before retrying.`,
      )
    }
  }

  throw new Error("Could not allocate the dated Operations place")
}
