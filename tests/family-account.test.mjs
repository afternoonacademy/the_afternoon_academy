import test from "node:test"
import assert from "node:assert/strict"
import { familyAccountBalance, sessionChangeDifference } from "../lib/family-account.mjs"

test("cheaper replacement creates a negative adjustment", () => {
  assert.equal(sessionChangeDifference(8000, 5000), -3000)
})

test("dearer replacement creates a positive adjustment", () => {
  assert.equal(sessionChangeDifference(5000, 8000), 3000)
})

test("family account derives a signed balance", () => {
  assert.equal(familyAccountBalance([{ amountCents: -3000 }, { amountCents: 1000 }]), -2000)
})
