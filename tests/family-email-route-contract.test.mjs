import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const loaderPath = new URL("../lib/admin/load-family-emails.ts", import.meta.url)
const routePath = new URL("../app/api/admin/families/[id]/emails/route.ts", import.meta.url)

function read(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, "utf8") : ""
}

test("family email route is admin-only and invalid cursors return 400", () => {
  const source = read(routePath)
  assert.match(source, /requireCapability\("view_family_pipeline"\)/)
  assert.match(source, /status:\s*400/)
  assert.match(source, /loadFamilyEmailPage/)
})

test("family email loader is family-scoped, deterministic and bounded", () => {
  const source = read(loaderPath)
  assert.match(source, /from\("email_delivery_log"\)/)
  assert.match(source, /eq\("parent_lead_id", parentLeadId\)/)
  assert.match(source, /order\("created_at", \{ ascending: false \}\)/)
  assert.match(source, /order\("id", \{ ascending: false \}\)/)
  assert.match(source, /limit\(FAMILY_EMAIL_PAGE_SIZE \+ 1\)/)
  assert.match(source, /buildFamilyEmailCursorFilter/)
  assert.match(source, /decodeFamilyEmailCursor/)
})
