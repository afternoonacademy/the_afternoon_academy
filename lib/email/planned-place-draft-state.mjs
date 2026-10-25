export function choosePlannedEmailDraft({
  generated,
  saved,
  bookingVersion,
}) {
  if (
    saved?.subject &&
    saved?.body &&
    saved.bookingVersion === bookingVersion
  ) {
    return {
      subject: saved.subject,
      body: saved.body,
      regenerated: false,
    }
  }

  return {
    subject: generated.subject,
    body: generated.body,
    regenerated: Boolean(saved?.subject && saved?.body),
  }
}

export function plannedEmailDraftChanged(previous, next) {
  return (
    String(previous?.subject || "") !== String(next?.subject || "") ||
    String(previous?.body || "") !== String(next?.body || "")
  )
}
