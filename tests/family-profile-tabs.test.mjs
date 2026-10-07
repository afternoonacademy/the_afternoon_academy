import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const path = new URL("../app/admin/families/[id]/page.tsx", import.meta.url)
const source = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : ""

test("family profile is the admin-only five-tab master record", () => {
  assert.match(source, /requireCapability\("view_family_pipeline"\)/)
  for (const label of ["Overview", "Children & places", "Payments & renewals", "Email history", "Documents"]) {
    assert.match(source, new RegExp(label.replace("&", "&")))
  }
  assert.match(source, /value="overview"/)
  assert.match(source, /value="children"/)
  assert.match(source, /value="payments"/)
  assert.match(source, /value="emails"/)
  assert.match(source, /value="documents"/)
})

test("family profile uses bounded email loader and preserves existing admin actions", () => {
  assert.match(source, /loadFamilyEmailPage/)
  assert.doesNotMatch(source, /from\("email_delivery_log"\)[\s\S]*order\("created_at"/)
  assert.match(source, /FamilyEmailHistory/)
  assert.match(source, /FamilyBalanceManager/)
  assert.match(source, /SessionChangeLauncher/)
  assert.match(source, /FamilyDocumentAuthorisation/)
})

test("family tab navigation uses desktop scrollbar-safe overflow", () => {
  assert.match(source, /overflow-x-auto overflow-y-hidden/)
  assert.match(source, /lg:overflow-visible/)
})


test("family operational queries are scoped to this household's learners", () => {
  assert.match(source, /const learnerIds = learners\.map/)
  assert.match(source, /\.in\("learner_id", learnerIds\.length/)
})
