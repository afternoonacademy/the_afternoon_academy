function iso(date) {
  return date.toISOString().slice(0, 10)
}

export function performancePeriod(period, today = new Date()) {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth()

  if (period === "last_month") {
    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 0))
    return { start: iso(start), end: iso(end), key: "last_month" }
  }
  if (period === "this_year") {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      key: "this_year",
    }
  }
  return {
    start: iso(new Date(Date.UTC(year, month, 1))),
    end: iso(new Date(Date.UTC(year, month + 1, 0))),
    key: "this_month",
  }
}

function datePart(value) {
  return value ? String(value).slice(0, 10) : null
}

function inPeriod(value, period) {
  const date = datePart(value)
  return Boolean(date && date >= period.start && date <= period.end)
}

function selectedDates(row) {
  const sessions = Array.isArray(row?.selected_sessions) ? row.selected_sessions : []
  return sessions
    .map((session) =>
      session && typeof session === "object" && !Array.isArray(session)
        ? session.date
        : null,
    )
    .filter((date) => typeof date === "string")
}

export function calculatePerformanceMetrics({
  period,
  payments = [],
  childEntitlements = [],
  standingPlacements = [],
  weeklyTemplates = [],
  academyTables = [],
  pendingBookings = [],
  renewalCases = [],
  activeFamilyCount = 0,
  activeLearnerCount = 0,
  today,
}) {
  const todayDate = today || new Date().toISOString().slice(0, 10)
  const paidPayments = payments.filter(
    (payment) => payment.status === "paid" && inPeriod(payment.received_at, period),
  )
  const paymentIds = new Set(paidPayments.map((payment) => payment.id))
  const revenueCents = paidPayments.reduce(
    (total, payment) => total + Number(payment.amount_cents || 0),
    0,
  )
  const payingFamilies = new Set(
    paidPayments.map((payment) => payment.parent_lead_id).filter(Boolean),
  )
  const periodChildEntitlements = childEntitlements.filter((entitlement) =>
    paymentIds.has(entitlement.payment_entitlement_id),
  )
  const paidLearners = new Set(
    periodChildEntitlements.map((entitlement) => entitlement.learner_id).filter(Boolean),
  )
  const paidSessions = periodChildEntitlements.reduce(
    (total, entitlement) =>
      total +
      selectedDates(entitlement).filter((date) => inPeriod(date, period)).length,
    0,
  )

  const livePlacements = standingPlacements.filter(
    (placement) =>
      placement.status === "active" &&
      (!placement.effective_to || placement.effective_to >= todayDate),
  )
  const recurringLearnerSessionsPerWeek = livePlacements.length
  const teachingBlockKeys = new Set(
    livePlacements.map((placement) =>
      [placement.weekday, placement.academy_table_id || placement.table_number, String(placement.starts_at).slice(0, 5)].join("|"),
    ),
  )

  const tableCapacity = new Map(
    academyTables
      .filter((table) => table.status === "active")
      .map((table) => [table.id, Number(table.seat_capacity || 0)]),
  )
  const activeTemplates = weeklyTemplates.filter(
    (template) =>
      template.status === "active" &&
      template.effective_from <= todayDate &&
      (!template.effective_to || template.effective_to >= todayDate),
  )
  const capacity = activeTemplates.reduce(
    (total, template) => total + (tableCapacity.get(template.academy_table_id) || 0),
    0,
  )

  const pendingSets = new Map()
  for (const booking of pendingBookings) {
    if (!["session_planned", "contacted", "accepted_awaiting_payment"].includes(booking.status)) continue
    const key = [
      booking.child_lead_id,
      booking.planned_period_start || "",
      booking.planned_period_end || "",
      booking.planned_amount_cents ?? "",
    ].join("|")
    if (!pendingSets.has(key)) {
      pendingSets.set(key, Number(booking.planned_amount_cents || 0))
    }
  }

  const actionableRenewalStates = new Set(["ready_to_send", "awaiting_payment", "overdue"])
  const renewalsDue = renewalCases.filter((item) => actionableRenewalStates.has(item.status)).length

  return {
    revenueCents,
    activeFamilyCount,
    activeLearnerCount,
    paidSessions,
    recurringLearnerSessionsPerWeek,
    teachingBlocksPerWeek: teachingBlockKeys.size,
    capacityUsed: recurringLearnerSessionsPerWeek,
    capacityAvailable: capacity,
    capacityUtilization: capacity ? recurringLearnerSessionsPerWeek / capacity : null,
    averageRevenuePerFamilyCents: payingFamilies.size
      ? Math.round(revenueCents / payingFamilies.size)
      : null,
    averageRevenuePerLearnerCents: paidLearners.size
      ? Math.round(revenueCents / paidLearners.size)
      : null,
    renewalsDue,
    pendingPlannedValueCents: [...pendingSets.values()].reduce((sum, value) => sum + value, 0),
  }
}
