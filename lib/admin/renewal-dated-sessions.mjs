import { datedSessionPrice } from "../dated-session-pricing.mjs"

export class RenewalDateError extends Error {}

export function renewalDateKey(session) {
  return JSON.stringify([
    session.placementId, session.date, session.academyTableId,
    session.tableNumber, session.startsAt,
  ])
}

export function matchesCurrentRenewalPlace(session, placement) {
  return Boolean(placement &&
    (!placement.effectiveFrom || session.date >= placement.effectiveFrom) &&
    (!placement.effectiveTo || session.date <= placement.effectiveTo) &&
    session.academyTableId === placement.academyTableId &&
    session.tableNumber === placement.tableNumber &&
    session.startsAt === placement.startsAt.slice(0, 5))
}

export function resolveRenewalDate({ submitted, placement, saved, learnerId, plan }) {
  if (submitted.learnerId !== learnerId) {
    throw new RenewalDateError("A selected date belongs to a different learner. Refresh the renewal.")
  }
  const savedDate = saved?.learnerId === learnerId &&
    renewalDateKey(saved) === renewalDateKey(submitted) ? saved : undefined
  const matchesPlace = placement?.learnerId === learnerId &&
    matchesCurrentRenewalPlace(submitted, placement)
  if (!matchesPlace && !savedDate) {
    throw new RenewalDateError("A new date does not match the selected recurring place. Remove it and add it again from the correct place.")
  }
  if (!plan && (!savedDate || savedDate.pricePlanId !== submitted.pricePlanId ||
      savedDate.priceCents !== submitted.priceCents)) {
    throw new RenewalDateError("Choose an active service before changing the price on this date.")
  }

  const price = datedSessionPrice(submitted, savedDate, plan)
  // Keep the timetable snapshot on an already-saved date whose standing
  // placement has moved. Only its commercial terms are editable here.
  if (!matchesPlace && savedDate) {
    return { ...savedDate, ...price }
  }

  const replacement = Boolean(submitted.replacement ||
    new Date(submitted.date + "T12:00:00Z").getUTCDay() !== placement.weekday)
  return {
    learnerId,
    learnerName: placement.learnerName,
    childLeadId: null,
    placementId: placement.placementId,
    date: submitted.date,
    academyTableId: placement.academyTableId,
    tableNumber: placement.tableNumber,
    seatNumber: null,
    startsAt: placement.startsAt.slice(0, 5),
    actualStartsAt: submitted.timeTbc ? undefined : submitted.actualStartsAt,
    timeTbc: Boolean(submitted.timeTbc),
    durationMinutes: placement.durationMinutes,
    teacherName: placement.teacherName,
    focus: placement.focus,
    ...price,
    replacement,
    sessionOrigin: replacement ? "replacement" : "recurring",
  }
}
