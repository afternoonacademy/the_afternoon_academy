import test from "node:test"
import assert from "node:assert/strict"

import {
  lifecycleAfterPlanEdit,
  canRecordPlannedPayment,
  paymentEligibleBookingStatuses,
} from "../lib/admin/lead-planning-lifecycle.mjs"

test("editing planned dates after parent contact preserves contacted lifecycle", () => {
  assert.deepEqual(
    lifecycleAfterPlanEdit({
      childPipelineStatus: "contacted",
      existingBookingStatus: "contacted",
    }),
    {
      childPipelineStatus: "contacted",
      bookingStatus: "contacted",
      clearContactMetadata: false,
    },
  )
})

test("editing an unsent plan keeps it at session planned", () => {
  assert.deepEqual(
    lifecycleAfterPlanEdit({
      childPipelineStatus: "session_planned",
      existingBookingStatus: "session_planned",
    }),
    {
      childPipelineStatus: "session_planned",
      bookingStatus: "session_planned",
      clearContactMetadata: true,
    },
  )
})

test("a new booking added after contact inherits contacted status", () => {
  assert.deepEqual(
    lifecycleAfterPlanEdit({
      childPipelineStatus: "contacted",
      existingBookingStatus: null,
    }),
    {
      childPipelineStatus: "contacted",
      bookingStatus: "contacted",
      clearContactMetadata: false,
    },
  )
})

test("payment can be recorded from a valid planned booking without requiring email", () => {
  assert.equal(
    canRecordPlannedPayment({
      pipelineStatus: "session_planned",
      plannedBookingCount: 1,
    }),
    true,
  )
})

test("payment remains available after parent contact", () => {
  assert.equal(
    canRecordPlannedPayment({
      pipelineStatus: "contacted",
      plannedBookingCount: 1,
    }),
    true,
  )
})

test("payment is not offered without a planned booking or once paid", () => {
  assert.equal(
    canRecordPlannedPayment({
      pipelineStatus: "session_planned",
      plannedBookingCount: 0,
    }),
    false,
  )
  assert.equal(
    canRecordPlannedPayment({
      pipelineStatus: "paid",
      plannedBookingCount: 1,
    }),
    false,
  )
})


test("server payment lookup accepts session-planned bookings without prior email", () => {
  assert.deepEqual(paymentEligibleBookingStatuses, [
    "session_planned",
    "contacted",
    "accepted_awaiting_payment",
  ])
})
