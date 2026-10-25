import assert from "node:assert/strict"
import test from "node:test"

import {
  goalProgressLabel,
  goalStatusAfterProgress,
  normaliseGoalProgressState,
} from "../lib/teaching/goals.mjs"

test("goal progress supports the four quick teacher choices", () => {
  assert.equal(normaliseGoalProgressState("no_change"), "no_change")
  assert.equal(normaliseGoalProgressState("progressing"), "progressing")
  assert.equal(normaliseGoalProgressState("achieved"), "achieved")
  assert.equal(normaliseGoalProgressState("needs_review"), "needs_review")
  assert.throws(() => normaliseGoalProgressState("below_expected"), /Unknown/)
})

test("only achieved closes the active goal", () => {
  assert.equal(goalStatusAfterProgress("active", "progressing"), "active")
  assert.equal(goalStatusAfterProgress("active", "needs_review"), "active")
  assert.equal(goalStatusAfterProgress("active", "no_change"), "active")
  assert.equal(goalStatusAfterProgress("active", "achieved"), "achieved")
})

test("goal progress labels stay concise", () => {
  assert.equal(goalProgressLabel("no_change"), "No change")
  assert.equal(goalProgressLabel("progressing"), "Progressing")
  assert.equal(goalProgressLabel("needs_review"), "Needs review")
})
