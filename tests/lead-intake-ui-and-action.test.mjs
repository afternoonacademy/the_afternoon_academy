import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import ts from "typescript"

function loadSource(path, overrides) {
  const url = new URL("../" + path, import.meta.url)
  const compiled = ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  const require = createRequire(url)
  new Function("require", "exports", compiled)((name) => overrides[name] || require(name), exports)
  return exports
}

const ui = {
  "@/components/ui/button": { Button: "button" },
  "@/components/ui/checkbox": { Checkbox: ({ checked }) => createElement("input", { type: "checkbox", checked, readOnly: true }) },
  "@/components/ui/input": { Input: "input" },
  "@/components/ui/label": { Label: "label" },
  "@/components/ui/textarea": { Textarea: "textarea" },
  "@/lib/leads/enquiry-options.mjs": createRequire(import.meta.url)("../lib/leads/enquiry-options.mjs"),
}
const { AvailabilityFields } = loadSource("components/forms/availability-fields.tsx", ui)
const { LeadChildFields } = loadSource("components/forms/lead-child-fields.tsx", {
  ...ui, "@/components/forms/availability-fields": { AvailabilityFields },
})

test("shared availability renders Saturday and Sunday independently and preserves weekday choices", () => {
  for (const language of ["en", "es"]) {
    const html = renderToStaticMarkup(createElement(AvailabilityFields, {
      days: ["wednesday", "saturday", "sunday"],
      times: ["17:00-17:50", "saturday@09:00-10:00", "sunday@14:00-15:00"],
      frequency: "two_days", language, onChange() {},
    }))
    assert.match(html, /17:00–17:50/)
    assert.match(html, /09:00–10:00/)
    assert.match(html, /14:00–15:00/)
    assert.match(html, /23:00–24:00/)
    assert.match(html, language === "en" ? /These sessions aren’t available yet/ : /Estas sesiones aún no están disponibles/)
  }
  const weekendOnly = renderToStaticMarkup(createElement(AvailabilityFields, { days: ["saturday"], times: [], frequency: "", optional: true, onChange() {} }))
  assert.doesNotMatch(weekendOnly, /Weekday session times/)
  assert.doesNotMatch(weekendOnly, /required=""/)
})

test("Admin child fields are optional with 3–21 age bounds; public fields stay required with 4–18", () => {
  const child = { key: 1, firstName: "", age: "", schoolName: "", schoolYear: "", curriculum: "", supportNeeds: [], courseOrExamBoard: "", preferredDays: [], preferredTimes: [], preferredFrequency: "", notes: "" }
  for (const optional of [true, false]) {
    const html = renderToStaticMarkup(createElement(LeadChildFields, { child, index: 0, language: "en", optional, canRemove: false, onChange() {}, onRemove() {} }))
    assert.match(html, optional ? /min="3" max="21"/ : /min="4" max="18"/)
    assert.equal(html.includes('required=""'), !optional)
  }
})

test("protected manual lead action writes partial details with null unknown child identity/email", async () => {
  let authorized = false
  const inserted = new Map()
  const { createManualLead } = loadSource("actions/update-lead-status.ts", {
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect() {} },
    "@/lib/auth/require-admin": { async requireAdmin() { authorized = true } },
    "@/lib/leads/manual-lead.mjs": createRequire(import.meta.url)("../lib/leads/manual-lead.mjs"),
    "@/lib/supabase/service": { supabaseService() { return { from(table) { return { insert(value) {
      assert.equal(authorized, true)
      inserted.set(table, value)
      return { error: null, select() {
        return { error: null, data: [{ id: "child-id" }], async single() { return { data: { id: "parent-id" }, error: null } } }
      } }
    } } } } } },
  })
  const form = new FormData()
  form.set("children", JSON.stringify([{}]))
  form.set("source", "whatsapp")
  await createManualLead({}, form)
  assert.equal(inserted.get("parent_leads").email, null)
  assert.equal(inserted.get("parent_leads").source, "whatsapp")
  assert.equal(inserted.get("child_leads")[0].first_name, null)
  assert.equal(inserted.get("child_leads")[0].child_age, null)
  assert.deepEqual(inserted.get("timetable_preferences")[0].preferred_times, [])
})
