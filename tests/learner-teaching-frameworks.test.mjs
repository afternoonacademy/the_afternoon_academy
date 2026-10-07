import assert from "node:assert/strict"
import test from "node:test"

import {
  activeLearnerFrameworks,
  defaultLearnerFramework,
  validateLearnerFrameworkAssignment,
} from "../lib/teaching/learner-frameworks.mjs"

const rows = [
  {
    id: "maths",
    status: "ended",
    starts_on: "2026-10-01",
    ends_on: "2026-11-28",
    is_default: false,
  },
  {
    id: "chem",
    status: "active",
    starts_on: "2027-03-03",
    ends_on: null,
    is_default: true,
  },
  {
    id: "study",
    status: "active",
    starts_on: "2027-04-07",
    ends_on: null,
    is_default: false,
  },
]

test("multiple active assignments are allowed and history is preserved", () => {
  assert.deepEqual(
    activeLearnerFrameworks(rows, "2027-04-20").map((item) => item.id),
    ["chem", "study"],
  )
  assert.equal(defaultLearnerFramework(rows, "2027-04-20")?.id, "chem")
})

test("ended default is ignored and no default means null", () => {
  assert.equal(
    defaultLearnerFramework(
      [
        {
          id: "old",
          status: "ended",
          starts_on: "2026-01-01",
          ends_on: "2026-02-01",
          is_default: true,
        },
      ],
      "2027-01-01",
    ),
    null,
  )
})

test("invalid date range and inactive default are rejected", () => {
  assert.throws(
    () =>
      validateLearnerFrameworkAssignment({
        status: "active",
        startsOn: "2027-05-02",
        endsOn: "2027-05-01",
        isDefault: false,
      }),
    /End date/,
  )
  assert.throws(
    () =>
      validateLearnerFrameworkAssignment({
        status: "paused",
        startsOn: "2027-05-01",
        endsOn: null,
        isDefault: true,
      }),
    /default/,
  )
})
