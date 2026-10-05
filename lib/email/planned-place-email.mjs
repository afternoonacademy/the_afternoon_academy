import { formatAcademyServiceGroups } from "./academy-period-email.mjs"

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

export function formatPlannedSessionGroups(sessions) {
  return formatAcademyServiceGroups(sessions, { initialPeriod: true })
}


export function normalizePlannedPlaceSendContent({ subject, body }) {
  const normalizedSubject = String(subject || "").trim()
  const normalizedBody = String(body || "").trim()

  if (!normalizedSubject) {
    throw new Error("Email subject is required")
  }
  if (!normalizedBody) {
    throw new Error("Email body is required")
  }
  if (normalizedSubject.length > 200) {
    throw new Error("Email subject is too long")
  }
  if (normalizedBody.length > 12000) {
    throw new Error("Email body is too long")
  }

  return {
    subject: normalizedSubject,
    body: normalizedBody,
  }
}
