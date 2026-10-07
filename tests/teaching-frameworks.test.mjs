import assert from "node:assert/strict"
import test from "node:test"

import {
  generalHomeworkSupportPromptConfig,
  normalizeTeachingFrameworkPrompts,
} from "../lib/teaching/frameworks.mjs"

test("general homework support uses the approved fast prompt order", () => {
  assert.deepEqual(
    generalHomeworkSupportPromptConfig.map((field) => field.label),
    [
      "What were we working on?",
      "Where did they need support?",
      "Where did we get to?",
      "What should we pick up next?",
    ],
  )
  assert.deepEqual(
    generalHomeworkSupportPromptConfig.map((field) => field.required),
    [true, false, true, true],
  )
  assert.equal(
    generalHomeworkSupportPromptConfig[3].quickChoice,
    "Nothing specific / Continue as normal",
  )
})

test("prompt configuration rejects unknown fields", () => {
  assert.throws(
    () =>
      normalizeTeachingFrameworkPrompts([
        { key: "school_report", label: "Write a report" },
      ]),
    /Unknown teaching note field/,
  )
})
