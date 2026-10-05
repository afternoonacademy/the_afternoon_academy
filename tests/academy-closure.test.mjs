import test from "node:test"
import assert from "node:assert/strict"

import { normalizeAcademyClosureRange } from "../lib/academy-closure.mjs"

test("single-day closure uses start date when end date is blank", () => {
  assert.deepEqual(
    normalizeAcademyClosureRange("2026-10-12", ""),
    { startsOn: "2026-10-12", endsOn: "2026-10-12" },
  )
})

test("multi-day closure preserves a valid end date", () => {
  assert.deepEqual(
    normalizeAcademyClosureRange("2026-10-12", "2026-10-14"),
    { startsOn: "2026-10-12", endsOn: "2026-10-14" },
  )
})

test("reversed closure range is rejected clearly", () => {
  assert.throws(
    () => normalizeAcademyClosureRange("2026-10-14", "2026-10-12"),
    /end date cannot be before the start date/i,
  )
})
