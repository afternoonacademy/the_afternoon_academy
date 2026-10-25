import assert from "node:assert/strict"
import test from "node:test"

import { renderLearningUpdateEmail } from "../lib/email/learning-update.mjs"

test("learning update email keeps parent-visible text and escapes html", () => {
  const result = renderLearningUpdateEmail({
    subject: "October update for Alba",
    body: "Alba worked on fractions.\nNext: practise <mixed numbers>.",
  })

  assert.equal(result.subject, "October update for Alba")
  assert.match(result.html, /fractions\.<br\s*\/>/)
  assert.match(result.html, /&lt;mixed numbers&gt;/)
  assert.equal(
    result.text,
    "Alba worked on fractions.\nNext: practise <mixed numbers>.",
  )
})
