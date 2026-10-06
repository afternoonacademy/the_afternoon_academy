export function groupCustomerFamilies(rows) {
  const families = new Map()
  let orphanCounter = 0

  for (const row of rows || []) {
    const parentKey = row.parentLeadId || `orphan:${row.learnerId || orphanCounter++}`
    let family = families.get(parentKey)
    if (!family) {
      family = {
        parentLeadId: row.parentLeadId || null,
        parentName: row.parentName || "Family",
        email: row.email || "—",
        children: [],
      }
      families.set(parentKey, family)
    }

    family.children.push({
      learnerId: row.learnerId,
      learnerName: row.learnerName,
      yearGroup: row.yearGroup || null,
      paidThrough: row.paidThrough || null,
      placeSummary: row.placeSummary || "Recurring place",
    })
  }

  const grouped = [...families.values()].map((family) => ({
    ...family,
    children: family.children.sort((a, b) =>
      String(a.learnerName || "").localeCompare(String(b.learnerName || "")),
    ),
    activeLearnerCount: family.children.length,
  }))

  grouped.sort((a, b) =>
    String(a.parentName || "").localeCompare(String(b.parentName || "")),
  )

  return {
    families: grouped,
    familyCount: grouped.length,
    learnerCount: grouped.reduce(
      (total, family) => total + family.activeLearnerCount,
      0,
    ),
  }
}
