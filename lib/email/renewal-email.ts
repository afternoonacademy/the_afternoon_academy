import type { PaidPeriodSession } from "@/lib/paid-period"

export const defaultRenewalSubject =
  "Renewal for {{learner_names}} at The Afternoon Academy"

export const defaultRenewalBody =
  "Hello {{parent_name}},\n\nWe hope you are well.\n\nYour next Academy period includes:\n\n{{service_dates}}\n\nThat is {{session_count}} session(s), totalling {{amount_due}}.\n\nIf you would like to continue, please make your usual bank transfer.\n\n{{payment_details}}\n\nWarmly,\nThe Afternoon Academy"

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value + "T12:00:00Z"))

export function applyEmailTemplate(
  template: string,
  values: Record<string, string>,
) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template,
  )
}

export function formatRenewalServiceDates(sessions: PaidPeriodSession[]) {
  const groups = new Map<string, PaidPeriodSession[]>()

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
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(
          (session) =>
            `${formatDate(session.date)}${session.replacement ? " · replacement" : ""}`,
        )
        .join("\n")

      return `${serviceName}\n${dates}`
    })
    .join("\n\n")
}

export function renderRenewalEmail({
  parentName,
  sessions,
  subjectTemplate = defaultRenewalSubject,
  bodyTemplate = defaultRenewalBody,
}: {
  parentName: string
  sessions: PaidPeriodSession[]
  subjectTemplate?: string | null
  bodyTemplate?: string | null
}) {
  const learnerNames = [
    ...new Set(sessions.map((session) => session.learnerName)),
  ]
  const amountCents = sessions.reduce(
    (total, session) => total + session.priceCents,
    0,
  )

  const values: Record<string, string> = {
    parent_name: parentName.trim(),
    learner_names: learnerNames.join(", "),
    service_dates: formatRenewalServiceDates(sessions),
    session_count: String(sessions.length),
    amount_due: money(amountCents),
    payment_details: [
      process.env.TAA_BUSINESS_NAME
        ? `Business name: ${process.env.TAA_BUSINESS_NAME}`
        : null,
      process.env.TAA_BANK_ACCOUNT_NAME
        ? `Account name: ${process.env.TAA_BANK_ACCOUNT_NAME}`
        : null,
      process.env.TAA_BANK_IBAN ? `IBAN: ${process.env.TAA_BANK_IBAN}` : null,
      `Payment reference: ${learnerNames.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n"),
  }

  return {
    subject: applyEmailTemplate(
      subjectTemplate || defaultRenewalSubject,
      values,
    ),
    body: applyEmailTemplate(bodyTemplate || defaultRenewalBody, values),
  }
}
