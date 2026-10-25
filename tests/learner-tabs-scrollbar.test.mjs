import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const source = fs.readFileSync(
  new URL("../app/admin/learners/[id]/page.tsx", import.meta.url),
  "utf8",
)

test("desktop learner tabs do not expose a scrollbar while mobile tabs can scroll horizontally", () => {
  assert.match(source, /overflow-x-auto/)
  assert.match(source, /overflow-y-hidden/)
  assert.match(source, /lg:overflow-visible/)
})
