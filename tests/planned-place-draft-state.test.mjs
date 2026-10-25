import test from "node:test"
import assert from "node:assert/strict"

import {
  choosePlannedEmailDraft,
  plannedEmailDraftChanged,
} from "../lib/email/planned-place-draft-state.mjs"

test("saved one-off draft wins when booking version is unchanged", () => {
  const result = choosePlannedEmailDraft({
    generated: { subject: "Generated", body: "Generated body" },
    saved: { subject: "Edited", body: "Edited body", bookingVersion: "v1" },
    bookingVersion: "v1",
  })

  assert.deepEqual(result, {
    subject: "Edited",
    body: "Edited body",
    regenerated: false,
  })
})

test("booking change replaces stale saved draft with newly generated content", () => {
  const result = choosePlannedEmailDraft({
    generated: { subject: "Generated v2", body: "Generated body v2" },
    saved: { subject: "Edited v1", body: "Edited body v1", bookingVersion: "v1" },
    bookingVersion: "v2",
  })

  assert.deepEqual(result, {
    subject: "Generated v2",
    body: "Generated body v2",
    regenerated: true,
  })
})

test("draft change detection ignores an identical save", () => {
  assert.equal(
    plannedEmailDraftChanged(
      { subject: "Subject", body: "Body" },
      { subject: "Subject", body: "Body" },
    ),
    false,
  )
})

test("draft change detection notices subject or body edits", () => {
  assert.equal(
    plannedEmailDraftChanged(
      { subject: "Subject", body: "Body" },
      { subject: "New subject", body: "Body" },
    ),
    true,
  )
})
