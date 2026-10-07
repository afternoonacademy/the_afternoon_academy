export const GOAL_PROGRESS_STATES = [
  "no_change",
  "progressing",
  "achieved",
  "needs_review",
]

export function normaliseGoalProgressState(value) {
  if (!GOAL_PROGRESS_STATES.includes(value)) {
    throw new Error("Unknown goal progress state")
  }
  return value
}

export function goalProgressLabel(value) {
  return value === "progressing"
    ? "Progressing"
    : value === "achieved"
      ? "Achieved"
      : value === "needs_review"
        ? "Needs review"
        : "No change"
}

export function goalStatusAfterProgress(currentStatus, progress) {
  if (progress === "achieved") return "achieved"
  return currentStatus
}
