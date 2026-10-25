import assert from "node:assert/strict"
import test from "node:test"

import {
  buildPreconversionLeadUpdates,
  canEditPreconversionChild,
  preconversionLeadEditSchema,
} from "../lib/admin/preconversion-lead-edit.mjs"

const valid = {
  parentLeadId: "11111111-1111-4111-8111-111111111111",
  childLeadId: "22222222-2222-4222-8222-222222222222",
  timetablePreferenceId: "33333333-3333-4333-8333-333333333333",
  parentName: "Parent",
  email: "parent@example.com",
  phone: "",
  area: "Madrid",
  source: "whatsapp",
  childFirstName: "Antonio",
  childAge: 11,
  schoolName: "School",
  schoolYear: "7",
  curriculum: "British",
  supportNeeds: ["homework"],
  notes: "Context",
  courseOrExamBoard: "",
  preferredDays: ["tuesday"],
  preferredTimes: ["17:00"],
  preferredFrequency: "one_day",
}

test("pre-conversion edit payload cannot contain lifecycle or payment fields", () => {
  const parsed = preconversionLeadEditSchema.parse(valid)
  const updates = buildPreconversionLeadUpdates(parsed)
  const serialized = JSON.stringify(updates)
  for (const forbidden of [
    "status",
    "pipeline_status",
    "planned_sessions",
    "planned_amount_cents",
    "payment",
    "contacted_at",
    "planned_email_draft",
  ]) {
    assert.equal(serialized.includes(forbidden), false)
  }
  assert.equal(updates.child.first_name, "Antonio")
})

test("converted child identity is no longer lead-editable", () => {
  assert.equal(canEditPreconversionChild({ learnerExists: false }), true)
  assert.equal(canEditPreconversionChild({ learnerExists: true }), false)
})

test("invalid email is rejected", () => {
  assert.equal(
    preconversionLeadEditSchema.safeParse({ ...valid, email: "not-email" }).success,
    false,
  )
})
