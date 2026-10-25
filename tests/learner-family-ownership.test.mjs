import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const learnerPath = new URL("../app/admin/learners/[id]/page.tsx", import.meta.url)
const source = fs.existsSync(learnerPath) ? fs.readFileSync(learnerPath, "utf8") : ""

test("learner workspace does not duplicate family administration", () => {
  assert.doesNotMatch(source, /FamilyCommunications/)
  assert.doesNotMatch(source, />Communications</)
  assert.doesNotMatch(source, />Family & place</)
  assert.doesNotMatch(source, /Booked paid dates/)
  assert.doesNotMatch(source, /selected_sessions/)
})

test("admins retain a concise link to the family master record", () => {
  assert.match(source, /canViewCommercial/)
  assert.match(source, /Open family account/)
  assert.match(source, /from\("parent_leads"\)/)
  assert.match(source, /select\("parent_name"\)/)
  assert.match(source, /Paid through/)
})
