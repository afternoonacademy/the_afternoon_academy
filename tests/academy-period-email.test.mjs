import test from "node:test"
import assert from "node:assert/strict"

import {
  formatAcademyServiceGroups,
  formatPaymentReference,
  childPeriodHeading,
} from "../lib/email/academy-period-email.mjs"

const sessions = [
  {
    learnerName: "Mya",
    date: "2026-10-01",
    startsAt: "17:00",
    pricePlanName: "General Homework Support",
    replacement: false,
    sessionOrigin: "recurring",
  },
  {
    learnerName: "Mya",
    date: "2026-10-05",
    startsAt: "18:00",
    pricePlanName: "General Homework Support",
    replacement: true,
    sessionOrigin: "replacement",
  },
]

test("service dates include session times", () => {
  assert.equal(
    formatAcademyServiceGroups(sessions, { initialPeriod: false }),
    [
      "General Homework Support",
      "Thursday 1 October · 17:00",
      "Monday 5 October · 18:00 · replacement",
    ].join("\n"),
  )
})

test("initial pre-agreed exception never says replacement", () => {
  const output = formatAcademyServiceGroups([
    {
      ...sessions[1],
      sessionOrigin: "pre_agreed_exception",
    },
  ], { initialPeriod: true })

  assert.equal(
    output,
    "General Homework Support\nMonday 5 October · 18:00",
  )
})

test("payment reference includes child and covered month", () => {
  assert.equal(
    formatPaymentReference("Mya", [
      { date: "2026-10-01" },
      { date: "2026-10-29" },
    ]),
    "Mya October 2026",
  )
})

test("payment reference includes both months when period spans months", () => {
  assert.equal(
    formatPaymentReference("Mya", [
      { date: "2026-10-29" },
      { date: "2026-11-05" },
    ]),
    "Mya October-November 2026",
  )
})

test("child period heading aligns initial and renewal terminology", () => {
  assert.equal(childPeriodHeading("Mya", "initial"), "Mya’s first Academy period includes:")
  assert.equal(childPeriodHeading("Mya", "renewal"), "Mya’s next Academy period includes:")
})
