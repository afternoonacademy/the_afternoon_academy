export function assignmentActiveOn(item, onDate) {
  if (!item || item.status !== "active") return false
  if (item.starts_on && item.starts_on > onDate) return false
  if (item.ends_on && item.ends_on < onDate) return false
  return true
}

export function activeLearnerFrameworks(assignments, onDate) {
  return (assignments || []).filter((item) => assignmentActiveOn(item, onDate))
}

export function defaultLearnerFramework(assignments, onDate) {
  return activeLearnerFrameworks(assignments, onDate).find((item) => item.is_default) || null
}

export function validateLearnerFrameworkAssignment({
  status,
  startsOn,
  endsOn,
  isDefault,
}) {
  if (endsOn && endsOn < startsOn) {
    throw new Error("End date cannot be before start date")
  }
  if (isDefault && status !== "active") {
    throw new Error("Only an active assignment can be the default")
  }
  return true
}
