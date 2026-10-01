export type AcademyClosure = {
  startsOn: string
  endsOn: string
  reason: string
}

export type PaidPeriodPlacement = {
  placementId: string
  learnerId: string | null
  learnerName: string
  childLeadId?: string | null
  weekday: number
  academyTableId: string
  tableNumber: number
  seatNumber: number
  startsAt: string
  durationMinutes: number
  teacherName: string | null
  focus: string | null
  pricePlanId: string
  pricePlanName: string
  priceCents: number
}

export type PaidPeriodSession = {
  learnerId: string | null
  learnerName: string
  childLeadId?: string | null
  placementId: string
  date: string
  academyTableId: string
  tableNumber: number
  seatNumber: number
  startsAt: string
  durationMinutes: number
  teacherName: string | null
  focus: string | null
  pricePlanId: string
  pricePlanName: string
  priceCents: number
  replacement: boolean
}

const iso = (value: Date) => value.toISOString().slice(0, 10)

export function addUtcDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return iso(date)
}

export function dateIsWithinClosure(date: string, closure: AcademyClosure) {
  return closure.startsOn <= date && closure.endsOn >= date
}

export function closureForDate(date: string, closures: AcademyClosure[]) {
  return closures.find((closure) => dateIsWithinClosure(date, closure))
}

export function expectedDatesForPlacement(
  placement: PaidPeriodPlacement,
  start: string,
  end: string,
  closures: AcademyClosure[],
) {
  const dates: string[] = []
  for (let cursor = start; cursor <= end; cursor = addUtcDays(cursor, 1)) {
    if (
      new Date(`${cursor}T12:00:00Z`).getUTCDay() === placement.weekday &&
      !closureForDate(cursor, closures)
    ) {
      dates.push(cursor)
    }
  }
  return dates
}

export function sessionFromPlacement(
  placement: PaidPeriodPlacement,
  date: string,
  replacement = false,
): PaidPeriodSession {
  return {
    learnerId: placement.learnerId,
    learnerName: placement.learnerName,
    childLeadId: placement.childLeadId || null,
    placementId: placement.placementId,
    date,
    academyTableId: placement.academyTableId,
    tableNumber: placement.tableNumber,
    seatNumber: placement.seatNumber,
    startsAt: placement.startsAt.slice(0, 5),
    durationMinutes: placement.durationMinutes,
    teacherName: placement.teacherName,
    focus: placement.focus,
    pricePlanId: placement.pricePlanId,
    pricePlanName: placement.pricePlanName,
    priceCents: placement.priceCents,
    replacement,
  }
}

export function sortPaidPeriodSessions(sessions: PaidPeriodSession[]) {
  return [...sessions].sort((a, b) =>
    a.learnerName.localeCompare(b.learnerName) ||
    a.date.localeCompare(b.date) ||
    a.startsAt.localeCompare(b.startsAt),
  )
}

export function paidPeriodSummary(sessions: PaidPeriodSession[]) {
  if (!sessions.length) {
    return { periodStart: null, periodEnd: null, amountCents: 0, count: 0 }
  }
  const dates = sessions.map((session) => session.date).sort()
  return {
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1],
    amountCents: sessions.reduce((total, session) => total + session.priceCents, 0),
    count: sessions.length,
  }
}

export function groupSessionsByLearner(sessions: PaidPeriodSession[]) {
  const groups = new Map<string, PaidPeriodSession[]>()
  for (const session of sortPaidPeriodSessions(sessions)) {
    const key = session.learnerId || session.childLeadId || session.learnerName
    const current = groups.get(key) || []
    current.push(session)
    groups.set(key, current)
  }
  return groups
}

export function closureDatesInRange(
  closures: AcademyClosure[],
  start: string,
  end: string,
) {
  const result: { date: string; reason: string }[] = []
  for (const closure of closures) {
    const first = closure.startsOn > start ? closure.startsOn : start
    const last = closure.endsOn < end ? closure.endsOn : end
    if (first > last) continue
    for (let cursor = first; cursor <= last; cursor = addUtcDays(cursor, 1)) {
      result.push({ date: cursor, reason: closure.reason })
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date))
}
