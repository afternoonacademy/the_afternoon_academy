export function canSubmitFamilyBalanceAction({
  actionType,
  learnerId,
  amountEuros,
}) {
  const amount = Number(amountEuros)
  return Boolean(actionType && learnerId && Number.isFinite(amount) && amount > 0)
}

export function canPreviewSessionChange({ templateId, planId }) {
  return Boolean(templateId && planId)
}
