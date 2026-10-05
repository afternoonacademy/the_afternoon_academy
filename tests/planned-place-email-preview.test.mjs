import test from "node:test"
import assert from "node:assert/strict"

import { renderPlannedPlaceEmailDraft } from "../lib/email/planned-place-email.mjs"

test("planned-place preview renders the same saved values used for sending", () => {
  const draft = renderPlannedPlaceEmailDraft({
    subjectTemplate: "Planned Academy place for {{child_name}}",
    bodyTemplate:
      "Dear {{parent_name}},\n\n{{recurring_place}}\n\n{{service_dates}}\n\nTotal {{amount_due}}\n\n{{payment_details}}",
    values: {
      parent_name: "Matty",
      child_name: "Mya",
      recurring_place: "Tuesday · 18:00 · Table 1 · Private tuition · €40.00 / session",
      price_plan_name: "Private tuition",
      session_price: "€40.00",
      service_dates: "Tue, 6 Oct 2026 · 18:00 · Table 1 · Private tuition · €40.00",
      session_count: "1",
      amount_due: "€40.00",
      payment_details: "Payment details:\nAccount name: Santander\nIBAN: TEST",
      payment_reference: "Mya",
    },
  })

  assert.equal(draft.subject, "Planned Academy place for Mya")
  assert.match(draft.body, /Dear Matty/)
  assert.match(draft.body, /Tue, 6 Oct 2026/)
  assert.match(draft.body, /Total €40\.00/)
})

test("unresolved template tokens are left visible for admin review", () => {
  const draft = renderPlannedPlaceEmailDraft({
    subjectTemplate: "Hello {{child_name}}",
    bodyTemplate: "{{missing_token}}",
    values: {
      child_name: "Mya",
    },
  })

  assert.equal(draft.subject, "Hello Mya")
  assert.equal(draft.body, "{{missing_token}}")
})


test("planned-place dates are grouped under the session name without repeating table or price", async () => {
  const { formatPlannedSessionGroups } = await import("../lib/email/planned-place-email.mjs")

  const output = formatPlannedSessionGroups([
    {
      date: "2026-10-01",
      pricePlanName: "General Homework Support",
      startsAt: "17:00",
      tableNumber: 1,
      priceCents: 2500,
      replacement: false,
      sessionOrigin: "recurring",
    },
    {
      date: "2026-10-05",
      pricePlanName: "General Homework Support",
      startsAt: "17:00",
      tableNumber: 1,
      priceCents: 2500,
      replacement: true,
      sessionOrigin: "replacement",
    },
    {
      date: "2026-10-08",
      pricePlanName: "General Homework Support",
      startsAt: "17:00",
      tableNumber: 1,
      priceCents: 2500,
      replacement: false,
      sessionOrigin: "pre_agreed_exception",
    },
  ])

  assert.equal(
    output,
    [
      "General Homework Support",
      "Thursday 1 October",
      "Monday 5 October · replacement",
      "Thursday 8 October",
    ].join("\n"),
  )
  assert.doesNotMatch(output, /Table 1/)
  assert.doesNotMatch(output, /€25/)
})
