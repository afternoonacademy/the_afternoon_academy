import assert from "node:assert/strict"
import test from "node:test"

import { buildMonthlyFamilyEvidence } from "../lib/teaching/family-summary-evidence.mjs"

test("monthly family evidence combines contextual notes, goals and teaching context without attendance", () => {
  const result = buildMonthlyFamilyEvidence({
    learnerName: "Alba",
    month: "2026-10",
    notes: [
      {
        occurred_on: "2026-10-05",
        note_format: "contextual",
        working_on: "Maths homework — fractions",
        support_needed: "Unsure when simplifying",
        reached: "Completed questions 1–8, final three independently",
        next_step: "Revisit simplifying fractions",
        framework_title: "General Homework Support",
      },
      {
        occurred_on: "2026-10-12",
        note_format: "legacy",
        what_happened: "Read a short passage and answered inference questions",
        why_it_mattered: "Needed one prompt to justify an answer from the text",
        next_step: "Ask for evidence before accepting an inference answer",
        framework_title: null,
      },
    ],
    goals: [
      { id: "g1", title: "Simplify fractions independently", domain: "academic", status: "active" },
    ],
    goalProgress: [
      { goal_id: "g1", progress_state: "progressing", occurred_on: "2026-10-20" },
    ],
    assignments: [
      {
        framework_title: "General Homework Support",
        curriculum_course: "Year 5 Maths",
        exam_board: null,
        current_unit_topic: "Fractions",
        learner_objectives: "Build independence with fraction methods",
        status: "active",
      },
    ],
    profile: {
      strengths: ["Persists with worked examples"],
      helpful_strategies: "One worked example followed by independent practice",
    },
    attendance: [{ attendance_date: "2026-10-05", status: "present" }],
  })

  assert.match(result.promptText, /Maths homework — fractions/)
  assert.match(result.promptText, /Completed questions 1–8/)
  assert.match(result.promptText, /Simplify fractions independently/)
  assert.match(result.promptText, /Progressing/)
  assert.match(result.promptText, /General Homework Support/)
  assert.match(result.promptText, /Fractions/)
  assert.doesNotMatch(result.promptText, /attendance|4 of 4|present/i)
})

test("monthly family evidence keeps legacy notes usable", () => {
  const result = buildMonthlyFamilyEvidence({
    learnerName: "Hugo",
    month: "2026-10",
    notes: [{
      occurred_on: "2026-10-02",
      note_format: "legacy",
      what_happened: "Practised multiplication facts",
      why_it_mattered: "Recall became quicker across the session",
      next_step: "Retrieve 7x and 8x tables next time",
      framework_title: null,
    }],
    goals: [],
    goalProgress: [],
    assignments: [],
    profile: null,
  })
  assert.match(result.promptText, /Practised multiplication facts/)
  assert.match(result.promptText, /Recall became quicker/)
  assert.match(result.promptText, /Retrieve 7x and 8x tables next time/)
})

test("framework guidance is supplied to AI separately from parent evidence", () => {
  const result = buildMonthlyFamilyEvidence({
    learnerName: "Leo",
    month: "2026-10",
    notes: [],
    goals: [],
    goalProgress: [],
    assignments: [{
      framework_title: "IGCSE Chemistry",
      curriculum_course: "Cambridge IGCSE Chemistry",
      current_unit_topic: "Stoichiometry",
      learner_objectives: "Apply mole ratios independently",
      evidence_guidance: "Emphasise application to unfamiliar exam-style questions.",
      goal_guidance: "Use specification-linked observable goals.",
      avoid_guidance: "Do not infer predicted grades.",
      status: "active",
    }],
    profile: null,
  })
  assert.match(result.aiGuidanceText, /unfamiliar exam-style questions/)
  assert.match(result.aiGuidanceText, /Do not infer predicted grades/)
  assert.doesNotMatch(JSON.stringify(result.sections), /predicted grades/)
})
