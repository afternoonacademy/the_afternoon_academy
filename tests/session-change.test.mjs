import test from "node:test"
import assert from "node:assert/strict"
import { isSessionChangeable, previewSessionChange } from "../lib/session-change.mjs"

const future = { date: "2026-10-20", priceCents: 4000 }

test("future session without attendance can change", () => {
  assert.equal(isSessionChangeable(future, null, "2026-10-05"), true)
})

test("past session cannot change", () => {
  assert.equal(isSessionChangeable({ ...future, date: "2026-10-01" }, null, "2026-10-05"), false)
})

test("attended future session cannot change", () => {
  assert.equal(isSessionChangeable(future, "present", "2026-10-05"), false)
})

test("preview reports exact price difference", () => {
  const result = previewSessionChange([{ priceCents: 4000 }, { priceCents: 4000 }], [{ priceCents: 2500 }, { priceCents: 2500 }])
  assert.deepEqual(result, { oldValueCents: 8000, newValueCents: 5000, differenceCents: -3000 })
})
