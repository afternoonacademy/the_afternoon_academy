import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const history = fs.existsSync(new URL("../components/admin/family-email-history.tsx", import.meta.url))
  ? fs.readFileSync(new URL("../components/admin/family-email-history.tsx", import.meta.url), "utf8")
  : ""
const communications = fs.existsSync(new URL("../components/admin/family-communications.tsx", import.meta.url))
  ? fs.readFileSync(new URL("../components/admin/family-communications.tsx", import.meta.url), "utf8")
  : ""

test("family email history is bounded, scrollable and paginated", () => {
  assert.match(history, /overflow-y-auto/)
  assert.match(history, /max-h-/)
  assert.match(history, /Load older emails/)
  assert.match(history, /setItems\(\(current\) => \[\.\.\.current, \.\.\.data\.items\]\)/)
  assert.match(history, /Retry/)
  assert.match(history, /initialError/)
  assert.match(history, /replaceItems/)
  assert.match(history, /recorded Academy email history/i)
})

test("existing communication rows still expose full retained content on expansion", () => {
  assert.match(communications, /<details/)
  assert.match(communications, /body_text/)
  assert.match(communications, /delivery_detail/)
  assert.match(communications, /error_message/)
})
