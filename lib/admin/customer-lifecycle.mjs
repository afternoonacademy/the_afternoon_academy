export function shouldShowActiveCustomer({
  learnerStatus,
  hasPaidEntitlement,
  hasCurrentOrUpcomingPlacement,
  isInRenewal,
  hasClosedRenewal,
}) {
  return (
    learnerStatus === "active" &&
    hasPaidEntitlement &&
    hasCurrentOrUpcomingPlacement &&
    !isInRenewal &&
    !hasClosedRenewal
  )
}
