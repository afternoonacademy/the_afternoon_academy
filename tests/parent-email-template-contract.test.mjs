import test from "node:test"
import assert from "node:assert/strict"

import {
  plannedPlaceTemplateContract,
  renewalTemplateContract,
  buildPaymentDetails,
} from "../lib/email/parent-template-contract.mjs"

test("initial template contract exposes every supported dynamic placeholder", () => {
  assert.deepEqual(
    plannedPlaceTemplateContract.placeholders.map((item) => item.key),
    [
      "parent_name",
      "child_name",
      "period_heading",
      "service_dates",
      "session_count",
      "amount_due",
      "payment_details",
      "payment_reference",
      "recurring_place",
      "price_plan_name",
      "session_price",
    ],
  )
})

test("renewal template contract exposes period heading payment details and payment reference", () => {
  assert.deepEqual(
    renewalTemplateContract.placeholders.map((item) => item.key),
    [
      "parent_name",
      "learner_names",
      "period_heading",
      "service_dates",
      "session_count",
      "amount_due",
      "payment_details",
      "payment_reference",
    ],
  )
})

test("default parent templates keep payment reference editable and separate from bank details", () => {
  assert.match(
    plannedPlaceTemplateContract.defaultBody,
    /Payment details:\n{{payment_details}}/,
  )
  assert.match(plannedPlaceTemplateContract.defaultBody, /Payment reference: {{payment_reference}}/)
  assert.match(
    renewalTemplateContract.defaultBody,
    /Payment details:\n{{payment_details}}/,
  )
  assert.match(renewalTemplateContract.defaultBody, /Payment reference: {{payment_reference}}/)
})

test("payment details contain bank details only and never bake in a reference", () => {
  assert.equal(
    buildPaymentDetails({
      bankName: "Santander",
      accountName: "JADIS SL",
      iban: "ES70 TEST",
    }),
    [
      "Bank name: Santander",
      "Account name: JADIS SL",
      "IBAN: ES70 TEST",
    ].join("\n"),
  )
})
