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
