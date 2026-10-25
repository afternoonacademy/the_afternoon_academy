import test from "node:test"
import assert from "node:assert/strict"

import { plannedSeatExpectationsForDate } from "../lib/admin/operations-planned-expectations.mjs"

test("planned lead seats appear only on their exact planned date", () => {
  const seats = plannedSeatExpectationsForDate([
    {
      id: "booking-1",
      status: "session_planned",
      childLeadId: "child-1",
      childName: "Mya",
      yearGroup: "Year 10",
      plannedSessions: [
        {
          date: "2026-10-13",
          academyTableId: "table-1",
          tableNumber: 1,
          seatNumber: 2,
          startsAt: "18:00",
          durationMinutes: 50,
          focus: "Private tuition",
        },
        {
          date: "2026-10-20",
          academyTableId: "table-1",
          tableNumber: 1,
          seatNumber: 2,
          startsAt: "18:00",
          durationMinutes: 50,
          focus: "Private tuition",
        },
      ],
    },
  ], "2026-10-13")

  assert.deepEqual(seats, [
    {
      bookingId: "booking-1",
      childLeadId: "child-1",
      childName: "Mya",
      yearGroup: "Year 10",
      academyTableId: "table-1",
      tableNumber: 1,
      seatNumber: 2,
      startsAt: "18:00",
      durationMinutes: 50,
      focus: "Private tuition",
      status: "planned",
    },
  ])
})

test("pre-agreed odd-date planned sessions use the exact saved table time and seat", () => {
  const seats = plannedSeatExpectationsForDate([
    {
      id: "booking-2",
      status: "contacted",
      childLeadId: "child-2",
      childName: "Alex",
      yearGroup: null,
      plannedSessions: [
        {
          date: "2026-10-15",
          academyTableId: "table-2",
          tableNumber: 2,
          seatNumber: 4,
          startsAt: "17:00",
          durationMinutes: 50,
          focus: "General Homework Support",
          sessionOrigin: "pre_agreed_exception",
        },
      ],
    },
  ], "2026-10-15")

  assert.equal(seats[0].seatNumber, 4)
  assert.equal(seats[0].startsAt, "17:00")
  assert.equal(seats[0].academyTableId, "table-2")
})

test("cancelled or paid-active bookings are not shown as planned seats", () => {
  const base = {
    childLeadId: "child-1",
    childName: "Mya",
    yearGroup: null,
    plannedSessions: [{
      date: "2026-10-13",
      academyTableId: "table-1",
      tableNumber: 1,
      seatNumber: 2,
      startsAt: "18:00",
      durationMinutes: 50,
      focus: "Private tuition",
    }],
  }

  assert.deepEqual(
    plannedSeatExpectationsForDate([
      { ...base, id: "cancelled", status: "cancelled" },
      { ...base, id: "paid", status: "paid_active" },
    ], "2026-10-13"),
    [],
  )
})
