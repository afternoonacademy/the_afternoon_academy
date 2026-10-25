import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const source = fs.readFileSync(
  new URL("../lib/admin/family-renewals.ts", import.meta.url),
  "utf8",
)

test("family renewal loader uses the advance window and open-case override", () => {
  assert.match(source, /shouldShowRenewal/)
  assert.match(source, /hasOpenCase: Boolean\(renewal\)/)
  assert.doesNotMatch(source, /if \(!isRenewalDue\(entitlement\.period_end, todayIso\)\) continue/)
  assert.ok(
    source.indexOf("const renewal = casesByLearnerSource.get") <
      source.indexOf("!shouldShowRenewal"),
    "open renewal case must be resolved before the visibility gate",
  )
})
