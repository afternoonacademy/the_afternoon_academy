import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const familyPage = fs.readFileSync(
  new URL("../app/admin/families/[id]/page.tsx", import.meta.url),
  "utf8",
)
const communications = fs.readFileSync(
  new URL("../components/admin/family-communications.tsx", import.meta.url),
  "utf8",
)

test("family account restores complete email traceability", () => {
  assert.match(familyPage, /from\("email_delivery_log"\)/)
  assert.match(familyPage, /\.eq\("parent_lead_id", id\)/)
  assert.match(familyPage, /\.order\("created_at", \{ ascending: false \}\)/)
  assert.match(familyPage, /title="Email history"/)
  assert.match(familyPage, /payment and renewal messages/)
})

test("family communications component can be retitled for parent-level history", () => {
  assert.match(communications, /title = "Family communications"/)
  assert.match(communications, /description = "Parent-facing communications only/)
  assert.match(communications, /\{title\}/)
  assert.match(communications, /\{description\}/)
})
