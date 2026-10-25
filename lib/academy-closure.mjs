export function normalizeAcademyClosureRange(startsOn, endsOn) {
  if (!startsOn) {
    throw new Error("Choose a closure start date")
  }

  const normalizedEnd = endsOn || startsOn
  if (normalizedEnd < startsOn) {
    throw new Error("Closure end date cannot be before the start date")
  }

  return { startsOn, endsOn: normalizedEnd }
}
