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


export function shouldCountActiveCustomer({
  learnerStatus,
  hasCurrentOrUpcomingPlacement,
  hasClosedRenewal,
}) {
  return (
    learnerStatus === "active" &&
    hasCurrentOrUpcomingPlacement &&
    !hasClosedRenewal
  )
}
