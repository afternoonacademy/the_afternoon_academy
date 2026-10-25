export const TEACHING_NOTE_FIELDS = [
  "working_on",
  "support_needed",
  "reached",
  "next_step",
]

export const generalHomeworkSupportPromptConfig = [
  {
    key: "working_on",
    label: "What were we working on?",
    help: "Briefly record the homework, subject and topic.",
    example: "Maths homework — adding and subtracting fractions.",
    required: true,
  },
  {
    key: "support_needed",
    label: "Where did they need support?",
    help: "Record the point where the learner became stuck, uncertain or needed help. Add what helped only if it will be useful next time.",
    example: "Could find a common denominator but became unsure when simplifying the final answer.",
    required: false,
    quickChoice: "No specific issue",
  },
  {
    key: "reached",
    label: "Where did we get to?",
    help: "Record what was completed and what the learner could do by the end of the session.",
    example: "Completed questions 1–8; last three completed independently after one worked example.",
    required: true,
  },
  {
    key: "next_step",
    label: "What should we pick up next?",
    help: "Record the most useful thing for the next TAA session to revisit, practise or check.",
    example: "Quick retrieval on simplifying fractions before moving on.",
    required: true,
    quickChoice: "Nothing specific / Continue as normal",
  },
]

export function normalizeTeachingFrameworkPrompts(config) {
  if (!Array.isArray(config)) throw new Error("Teaching prompt configuration must be a list")
  const allowed = new Set(TEACHING_NOTE_FIELDS)
  const byKey = new Map()
  for (const field of config) {
    if (!field || typeof field !== "object" || !allowed.has(field.key)) {
      throw new Error(`Unknown teaching note field: ${field?.key || "missing"}`)
    }
    byKey.set(field.key, { ...field })
  }
  return TEACHING_NOTE_FIELDS.filter((key) => byKey.has(key)).map((key) => byKey.get(key))
}

export function teachingFrameworkStatusLabel(status) {
  return status === "published" ? "Published" : status === "archived" ? "Archived" : "Draft"
}
