function clean(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function titleCaseProgress(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function noteLines(note) {
  const framework = clean(note.framework_title)
  const heading = `${note.occurred_on}${framework ? ` · ${framework}` : ""}`

  if (note.note_format === "contextual") {
    return [
      heading,
      clean(note.working_on) ? `Worked on: ${clean(note.working_on)}` : null,
      clean(note.support_needed) ? `Support needed: ${clean(note.support_needed)}` : null,
      clean(note.reached) ? `Where they got to: ${clean(note.reached)}` : null,
      clean(note.next_step) ? `Pick up next: ${clean(note.next_step)}` : null,
    ].filter(Boolean)
  }

  return [
    heading,
    clean(note.what_happened) ? `What happened: ${clean(note.what_happened)}` : null,
    clean(note.why_it_mattered) ? `Why it mattered: ${clean(note.why_it_mattered)}` : null,
    clean(note.next_step) ? `Next step: ${clean(note.next_step)}` : null,
  ].filter(Boolean)
}

/**
 * @param {{
 *   learnerName: string,
 *   month: string,
 *   notes?: Array<any>,
 *   goals?: Array<any>,
 *   goalProgress?: Array<any>,
 *   assignments?: Array<any>,
 *   profile?: any
 * }} input
 */
export function buildMonthlyFamilyEvidence(input) {
  const {
    learnerName,
    month,
    notes = [],
    goals = [],
    goalProgress = [],
    assignments = [],
    profile,
  } = input
  const sections = []

  if (assignments.length) {
    sections.push({
      title: "Teaching context",
      lines: assignments.flatMap((assignment) => {
        const parts = [
          clean(assignment.framework_title),
          clean(assignment.curriculum_course),
          clean(assignment.exam_board),
          clean(assignment.current_unit_topic)
            ? `Current focus: ${clean(assignment.current_unit_topic)}`
            : null,
          clean(assignment.learner_objectives)
            ? `Objectives: ${clean(assignment.learner_objectives)}`
            : null,
        ].filter(Boolean)
        return parts.length ? [parts.join(" · ")] : []
      }),
    })
  }

  if (notes.length) {
    sections.push({
      title: "Session evidence",
      lines: notes.flatMap((note) => noteLines(note)),
    })
  }

  if (goals.length) {
    const progressByGoal = new Map()
    for (const item of goalProgress) {
      if (!progressByGoal.has(item.goal_id)) progressByGoal.set(item.goal_id, item)
    }
    sections.push({
      title: "Goals and progress",
      lines: goals.map((goal) => {
        const latest = progressByGoal.get(goal.id)
        const progress = latest ? ` · ${titleCaseProgress(latest.progress_state)}` : ""
        return `${goal.title}${goal.domain ? ` · ${titleCaseProgress(goal.domain)}` : ""}${progress}`
      }),
    })
  }

  const profileLines = [
    Array.isArray(profile?.strengths) && profile.strengths.length
      ? `Strengths: ${profile.strengths.join(", ")}`
      : null,
    Array.isArray(profile?.barriers) && profile.barriers.length
      ? `Current barriers: ${profile.barriers.join(", ")}`
      : null,
    Array.isArray(profile?.interests) && profile.interests.length
      ? `Interests: ${profile.interests.join(", ")}`
      : null,
    clean(profile?.helpful_strategies)
      ? `Helpful strategies: ${clean(profile.helpful_strategies)}`
      : null,
    clean(profile?.parent_priorities)
      ? `Parent priorities: ${clean(profile.parent_priorities)}`
      : null,
  ].filter(Boolean)

  if (profileLines.length) {
    sections.push({ title: "Useful learner context", lines: profileLines })
  }

  const aiGuidanceLines = assignments.flatMap((assignment) => [
    clean(assignment.evidence_guidance),
    clean(assignment.goal_guidance),
    clean(assignment.avoid_guidance),
  ].filter(Boolean))
  const aiGuidanceText = aiGuidanceLines.join("\n")

  const promptText = [
    `Learner: ${learnerName}`,
    `Month: ${month}`,
    ...sections.flatMap((section) => [
      `\n${section.title}`,
      ...section.lines.map((line) => `- ${line}`),
    ]),
  ].join("\n")

  return { sections, promptText, aiGuidanceText, noteCount: notes.length }
}
