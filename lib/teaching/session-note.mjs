function activeOn(item, onDate) {
  return (
    item?.status === "active" &&
    (!item.starts_on || item.starts_on <= onDate) &&
    (!item.ends_on || item.ends_on >= onDate)
  )
}

export function resolveSessionFramework({
  assignments = [],
  requestedAssignmentId,
  onDate,
}) {
  const active = assignments.filter((item) => activeOn(item, onDate))
  if (requestedAssignmentId) {
    const selected = assignments.find((item) => item.id === requestedAssignmentId)
    if (!selected || !activeOn(selected, onDate)) {
      throw new Error("Choose an active teaching framework")
    }
    return selected
  }

  const defaultItem = active.find((item) => item.is_default)
  if (defaultItem) return defaultItem
  if (active.length === 1) return active[0]
  if (active.length > 1) {
    throw new Error("Choose the teaching framework for this session")
  }
  return null
}

export function buildPromptSnapshot(version) {
  if (!version) return null
  return {
    frameworkVersionId: version.id,
    prompts: JSON.parse(
      JSON.stringify(Array.isArray(version.prompt_config) ? version.prompt_config : []),
    ),
  }
}

export function validateHomeworkSupportNote({
  workingOn,
  supportNeeded,
  reached,
  nextStep,
}) {
  if (!String(workingOn || "").trim()) {
    throw new Error("What were we working on is required")
  }
  if (!String(reached || "").trim()) {
    throw new Error("Where did we get to is required")
  }
  if (!String(nextStep || "").trim()) {
    throw new Error("What should we pick up next is required")
  }
  if (String(supportNeeded || "").length > 2000) {
    throw new Error("Support note is too long")
  }
  return true
}
