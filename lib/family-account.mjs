export function sessionChangeDifference(oldValueCents, newValueCents) {
  return newValueCents - oldValueCents
}

export function familyAccountBalance(entries) {
  return entries.reduce((total, entry) => total + entry.amountCents, 0)
}
