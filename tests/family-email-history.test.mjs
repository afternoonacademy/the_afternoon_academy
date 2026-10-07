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

test("family account exposes recorded email traceability through the paginated history", () => {
  assert.match(familyPage, /loadFamilyEmailPage/)
  assert.match(familyPage, /FamilyEmailHistory/)
  assert.match(familyPage, /value="emails"/)
  assert.doesNotMatch(
    familyPage,
    /from\("email_delivery_log"\)[\s\S]*order\("created_at", \{ ascending: false \}\)/,
  )
})

test("family communications component remains reusable for the family email history", () => {
  assert.match(communications, /title = "Family communications"/)
  assert.match(communications, /description = "Parent-facing communications only/)
  assert.match(communications, /showHeader = true/)
  assert.match(communications, /\{title\}/)
  assert.match(communications, /\{description\}/)
})
