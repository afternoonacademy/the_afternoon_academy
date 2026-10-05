export function sessionChangeDifference(oldValueCents, newValueCents) {
  return newValueCents - oldValueCents
}

export function familyAccountBalance(entries) {
  return entries.reduce((total, entry) => total + entry.amountCents, 0)
}

export function settlementOffset(balanceCents, amountCents) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Enter a valid settlement amount")
  }

  const available = Math.abs(balanceCents)
  if (balanceCents === 0 || amountCents > available) {
    throw new Error("Amount exceeds the available family balance")
  }

  return balanceCents < 0 ? amountCents : -amountCents
}
