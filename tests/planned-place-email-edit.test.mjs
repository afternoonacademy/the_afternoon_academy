import test from "node:test"
import assert from "node:assert/strict"

import { normalizePlannedPlaceSendContent } from "../lib/email/planned-place-email.mjs"

test("one-off planned-place email edits are the content selected for sending", () => {
  assert.deepEqual(
    normalizePlannedPlaceSendContent({
      subject: "A personal subject for Mya",
      body: "Hello Matty,\n\nThis is the manually edited email.",
    }),
    {
      subject: "A personal subject for Mya",
      body: "Hello Matty,\n\nThis is the manually edited email.",
    },
  )
})

test("planned-place send content rejects blank edits", () => {
  assert.throws(
    () =>
      normalizePlannedPlaceSendContent({
        subject: " ",
        body: "Hello",
      }),
    /subject/i,
  )
})
