function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value + "T12:00:00Z"))
}

function replacementSuffix(session, initialPeriod) {
  if (initialPeriod && session?.sessionOrigin === "pre_agreed_exception") return ""
  return session?.replacement ? " · replacement" : ""
}

export function formatAcademyServiceGroups(
  sessions,
  { initialPeriod = false } = {},
) {
  const groups = new Map()

  for (const session of sessions) {
    const serviceName =
      session.pricePlanName || session.focus || "Academy sessions"
    const current = groups.get(serviceName) || []
    current.push(session)
    groups.set(serviceName, current)
  }

  return [...groups.entries()]
    .map(([serviceName, serviceSessions]) => {
      const dates = [...serviceSessions]
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            String(a.startsAt || "").localeCompare(String(b.startsAt || "")),
        )
        .map(
          (session) =>
            formatDate(session.date) +
            " · " +
            String(session.startsAt || "").slice(0, 5) +
            replacementSuffix(session, initialPeriod),
        )
        .join("\n")

      return serviceName + "\n" + dates
    })
    .join("\n\n")
}

export function childPeriodHeading(childName, periodKind) {
  return (
    childName +
    (periodKind === "initial"
      ? "’s first Academy period includes:"
      : "’s next Academy period includes:")
  )
}

export function formatPaymentReference(childName, sessions) {
  const dates = sessions
    .map((session) => session.date)
    .filter(Boolean)
    .sort()

  if (!dates.length) return childName

  const first = new Date(dates[0] + "T12:00:00Z")
  const last = new Date(dates[dates.length - 1] + "T12:00:00Z")

  const month = (date) =>
    new Intl.DateTimeFormat("en-GB", { month: "long" }).format(date)

  const firstYear = first.getUTCFullYear()
  const lastYear = last.getUTCFullYear()

  if (
    first.getUTCMonth() === last.getUTCMonth() &&
    firstYear === lastYear
  ) {
    return childName + " " + month(first) + " " + firstYear
  }

  if (firstYear === lastYear) {
    return childName + " " + month(first) + "-" + month(last) + " " + firstYear
  }

  return (
    childName +
    " " +
    month(first) +
    " " +
    firstYear +
    "-" +
    month(last) +
    " " +
    lastYear
  )
}
