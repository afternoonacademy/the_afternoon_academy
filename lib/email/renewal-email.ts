import type { PaidPeriodSession } from "@/lib/paid-period"
import {
  childPeriodHeading,
  formatAcademyServiceGroups,
  formatPaymentReference,
} from "@/lib/email/academy-period-email.mjs"

export const defaultRenewalSubject =
  "Renewal for {{learner_names}} at The Afternoon Academy"

export const defaultRenewalBody =
  "Hello {{parent_name}},\n\nWe hope you are well.\n\n{{period_heading}}\n\n{{service_dates}}\n\nThat is {{session_count}} session(s), totalling {{amount_due}}.\n\nIf you would like to continue, please make your usual bank transfer.\n\n{{payment_details}}\n\nWarmly,\nThe Afternoon Academy"

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

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
  return formatAcademyServiceGroups(sessions, { initialPeriod: false })
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

  const learnerLabel = learnerNames.join(", ")
  const values: Record<string, string> = {
    parent_name: parentName.trim(),
    learner_names: learnerLabel,
    period_heading: childPeriodHeading(learnerLabel, "renewal"),
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
      `Payment reference: ${formatPaymentReference(learnerLabel, sessions)}`,
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
