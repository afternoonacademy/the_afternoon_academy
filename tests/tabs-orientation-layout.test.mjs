import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const source = fs.readFileSync(new URL("../components/ui/tabs.tsx", import.meta.url), "utf8")

test("horizontal tabs stack the tab list above the active panel", () => {
  assert.match(source, /data-\[orientation=horizontal\]:flex-col/)
  assert.doesNotMatch(source, /data-horizontal:flex-col/)
})

test("tab orientation styles target Radix data-orientation", () => {
  assert.match(source, /group-data-\[orientation=horizontal\]\/tabs:/)
  assert.match(source, /group-data-\[orientation=vertical\]\/tabs:/)
  assert.doesNotMatch(source, /group-data-horizontal\/tabs:/)
  assert.doesNotMatch(source, /group-data-vertical\/tabs:/)
})
