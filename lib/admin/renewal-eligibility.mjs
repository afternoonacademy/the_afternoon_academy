export function isRenewalDue(periodEnd, today) {
  return periodEnd <= today
}
