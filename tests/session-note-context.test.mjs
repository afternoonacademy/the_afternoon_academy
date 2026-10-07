import assert from "node:assert/strict"
import test from "node:test"
import { resolveSessionFramework, validateHomeworkSupportNote } from "../lib/teaching/session-note.mjs"

test("session framework uses default and permits active override", () => {
  const assignments = [
    { id: "default", status: "active", starts_on: "2026-10-01", ends_on: null, is_default: true },
    { id: "other", status: "active", starts_on: "2026-10-01", ends_on: null, is_default: false },
  ]
  assert.equal(resolveSessionFramework({ assignments, onDate: "2026-10-07" }).id, "default")
  assert.equal(resolveSessionFramework({ assignments, requestedAssignmentId: "other", onDate: "2026-10-07" }).id, "other")
})

test("quick homework note keeps support optional", () => {
  assert.doesNotThrow(() => validateHomeworkSupportNote({
    workingOn: "Fractions",
    supportNeeded: "",
    reached: "Questions 1 to 8",
    nextStep: "Continue as normal",
  }))
})
