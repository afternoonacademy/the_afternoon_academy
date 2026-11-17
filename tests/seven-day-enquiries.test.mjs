import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import ts from "typescript"

// Exercise the real shared validation used by public and manual family entry.
const source = readFileSync(new URL("../lib/validations/lead.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
const exports = {}
new Function("require", "exports", compiled)(createRequire(import.meta.url), exports)
const { childLeadFormSchema, leadFormSchema } = exports

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
const child = {
  firstName: "Example child",
  age: 10,
  curriculum: "british",
  supportNeeds: ["homework_help"],
  preferredDays: ["monday"],
  preferredTimes: ["17:00-17:50"],
  preferredFrequency: "one_day",
}

for (const day of days) {
  test(`family enquiry accepts ${day} as the only preferred day`, () => {
    const result = childLeadFormSchema.parse({ ...child, preferredDays: [day] })
    assert.deepEqual(result.preferredDays, [day])
  })
}

test("mixed and all-day sibling preferences remain independent", () => {
  const result = leadFormSchema.parse({
    parentName: "Example parent", email: "parent@example.com", phone: "123456789",
    interestLevel: "very_interested", consentContact: true,
    children: [
      { ...child, preferredDays: ["wednesday", "saturday"] },
      { ...child, firstName: "Example sibling", preferredDays: days },
    ],
  })
  assert.deepEqual(result.children.map((item) => item.preferredDays), [["wednesday", "saturday"], days])
})

test("empty and unknown day preferences still fail validation", () => {
  for (const preferredDays of [[], ["holiday"], ["monday", "holiday"]]) {
    assert.equal(childLeadFormSchema.safeParse({ ...child, preferredDays }).success, false)
  }
})

test("shared English/Spanish fields expose exactly seven days in week order", () => {
  const fields = readFileSync(new URL("../components/forms/lead-child-fields.tsx", import.meta.url), "utf8")
  const options = [...fields.matchAll(/\{ value: "([a-z]+)", en: "([A-Za-z]+)", es: "([^"]+)" \}/g)]
    .filter((match) => days.includes(match[1]))
  assert.deepEqual(options.map((match) => match[1]), days)
  assert.deepEqual(options.map((match) => match[3]), ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"])
})

test("public timetable wording consistently includes all seven days", () => {
  for (const path of ["app/(public)/page.tsx", "app/(public)/es/page.tsx", "lib/discovery/arturo-soria-guide.ts"]) {
    const text = readFileSync(new URL("../" + path, import.meta.url), "utf8")
    assert.doesNotMatch(text, /Monday, Tuesday, Thursday|lunes, martes, jueves/i)
    assert.match(text, /Monday–Sunday|lunes a domingo/i)
  }
})
