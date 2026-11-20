// Compare the terms that identify an offer, irrespective of JSONB key order
// and optional metadata added to older saved sessions.
export function renewalOfferChanged(previous, next) {
  const terms = (sessions) =>
    sessions.map((session) => JSON.stringify([
      session.placementId,
      session.date,
      session.academyTableId,
      session.tableNumber,
      session.startsAt,
      session.timeTbc ? null : session.actualStartsAt || session.startsAt,
      session.pricePlanId,
      session.priceCents,
      session.sessionOrigin === "pre_agreed_exception" ? "pre_agreed_exception" : session.replacement ? "replacement" : "recurring",
    ])).sort()
  return JSON.stringify(terms(previous)) !== JSON.stringify(terms(next))
}

export function renewalOfferEmailKey(caseId, revision) {
  return revision === 0 ? `renewal-${caseId}` : `renewal-${caseId}-v${revision}`
}

export function hasSentRenewalOffer(renewal) {
  const sentRevision = renewal.sent_offer_revision ?? (renewal.email_sent_at ? 0 : null)
  return sentRevision === renewal.offer_revision
}
