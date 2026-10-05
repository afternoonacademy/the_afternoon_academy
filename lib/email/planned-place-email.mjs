export function renderPlannedPlaceEmailDraft({
  subjectTemplate,
  bodyTemplate,
  values,
}) {
  const apply = (source) =>
    Object.entries(values).reduce(
      (result, [key, value]) =>
        result.replaceAll("{{" + key + "}}", String(value)),
      source,
    )

  return {
    subject: apply(subjectTemplate),
    body: apply(bodyTemplate),
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value + "T12:00:00Z"))
}

function suffix(session) {
  if (session?.sessionOrigin === "pre_agreed_exception") return ""
  return session?.replacement ? " · replacement" : ""
}

export function formatPlannedSessionGroups(sessions) {
  const groups = new Map()

  for (const session of sessions) {
    const key = session.pricePlanName || "Academy session"
    const current = groups.get(key) || []
    current.push(session)
    groups.set(key, current)
  }

  return [...groups.entries()]
    .map(([name, items]) =>
      [
        name,
        ...items
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((session) => formatDate(session.date) + suffix(session)),
      ].join("\n"),
    )
    .join("\n\n")
}
