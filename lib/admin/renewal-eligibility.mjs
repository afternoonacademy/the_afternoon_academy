export const RENEWAL_WINDOW_DAYS = 10

function parseIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid renewal date")
  }
  const date = new Date(value + "T12:00:00Z")
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Invalid renewal date")
  }
  return date
}

export function renewalWindowOpensOn(
  periodEnd,
  windowDays = RENEWAL_WINDOW_DAYS,
) {
  if (!Number.isInteger(windowDays) || windowDays < 0) {
    throw new Error("Invalid renewal window")
  }
  const date = parseIsoDate(periodEnd)
  date.setUTCDate(date.getUTCDate() - windowDays)
  return date.toISOString().slice(0, 10)
}

export function isRenewalWindowOpen(
  periodEnd,
  today,
  windowDays = RENEWAL_WINDOW_DAYS,
) {
  parseIsoDate(today)
  return renewalWindowOpensOn(periodEnd, windowDays) <= today
}

export function shouldShowRenewal({
  periodEnd,
  today,
  hasOpenCase = false,
  windowDays = RENEWAL_WINDOW_DAYS,
}) {
  return (
    hasOpenCase ||
    isRenewalWindowOpen(periodEnd, today, windowDays)
  )
}

// "Due" remains the operational paid-through boundary. It is deliberately
// separate from the earlier admin planning window above.
export function isRenewalDue(periodEnd, today) {
  parseIsoDate(periodEnd)
  parseIsoDate(today)
  return periodEnd <= today
}
