import type { PaidPeriodSession } from "@/lib/paid-period"
import {
  childPeriodHeading,
  formatAcademyServiceGroups,
  formatPaymentReference,
} from "@/lib/email/academy-period-email.mjs"
import {
  buildPaymentDetails,
  renewalTemplateContract,
} from "@/lib/email/parent-template-contract.mjs"

export const defaultRenewalSubject = renewalTemplateContract.defaultSubject

export const defaultRenewalBody = renewalTemplateContract.defaultBody

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
    payment_details:
      buildPaymentDetails({
        businessName: process.env.TAA_BUSINESS_NAME || "",
        accountName: process.env.TAA_BANK_ACCOUNT_NAME || "",
        iban: process.env.TAA_BANK_IBAN || "",
      }) || "Please use the usual Academy bank-transfer details.",
    payment_reference: formatPaymentReference(learnerLabel, sessions),
  }

  return {
    subject: applyEmailTemplate(
      subjectTemplate || defaultRenewalSubject,
      values,
    ),
    body: applyEmailTemplate(bodyTemplate || defaultRenewalBody, values),
  }
}
