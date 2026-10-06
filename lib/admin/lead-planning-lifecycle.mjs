export function lifecycleAfterPlanEdit({
  childPipelineStatus,
  existingBookingStatus,
}) {
  const contacted = childPipelineStatus === "contacted"

  return {
    childPipelineStatus: contacted ? "contacted" : "session_planned",
    bookingStatus:
      contacted && existingBookingStatus === "accepted_awaiting_payment"
        ? "accepted_awaiting_payment"
        : contacted
          ? "contacted"
          : "session_planned",
    clearContactMetadata: !contacted,
  }
}

export function canRecordPlannedPayment({
  pipelineStatus,
  plannedBookingCount,
}) {
  return (
    plannedBookingCount > 0 &&
    (pipelineStatus === "session_planned" || pipelineStatus === "contacted")
  )
}
