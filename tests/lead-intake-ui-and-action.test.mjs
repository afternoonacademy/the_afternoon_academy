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
  "@/lib/leads/free-trial.mjs": createRequire(import.meta.url)("../lib/leads/free-trial.mjs"),
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

test("the free-trial form omits weekly frequency in both languages", () => {
  for (const language of ["en", "es"]) {
    const props = { days: [], times: [], frequency: "", language, onChange() {} }
    const question = language === "en" ? /How many sessions per week/ : /Cuántas sesiones por semana/
    assert.match(renderToStaticMarkup(createElement(AvailabilityFields, props)), question)
    assert.doesNotMatch(renderToStaticMarkup(createElement(AvailabilityFields, { ...props, showFrequency: false })), question)
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

test("free first-session enquiries use the shared intake and persist only an approved referral", async () => {
  const saved = new Map()
  const partnerId = "165778da-2c4e-423f-90a7-546efcb38761"
  let partnerActive = true
  const trialStudent = {
    age: 16, firstName: "Example", schoolYear: "Year 11", curriculum: "spanish",
    supportNeeds: ["igcse_chemistry"], courseOrExamBoard: "Cambridge",
    preferredDays: ["monday"], preferredTimes: ["17:00-17:50"], preferredFrequency: "two_days",
  }
  const actions = loadSource("actions/submit-lead.ts", {
    "next/navigation": { redirect() {} },
    "@/lib/leads/free-trial.mjs": ui["@/lib/leads/free-trial.mjs"],
    "@/lib/validations/lead": loadSource("lib/validations/lead.ts", {}),
    "@/lib/email/resend": { resend: null },
    "@/lib/email/templates": {},
    "@/lib/supabase/admin": { supabaseAdmin: { from(table) {
      if (table === "academy_marketing_partners") return { select(column) {
        assert.equal(column, "name")
        return { eq(key, value) {
          assert.equal(key, "id")
          assert.equal(value, partnerId)
          return { eq(activeKey, activeValue) {
            assert.equal(activeKey, "active")
            assert.equal(activeValue, true)
            return { async maybeSingle() {
              return { data: partnerActive ? { name: "Test partner" } : null, error: null }
            } }
          } }
        } }
      } }
      return { insert(value) {
        saved.set(table, value)
        return { error: null, select() {
          return { data: [{ id: "child-test" }], error: null, async single() { return { data: { id: "parent-test" }, error: null } } }
        } }
      } }
    } } },
  })
  const form = new FormData()
  form.set("language", "es")
  form.set("parentName", "Parent Example")
  form.set("email", "example@example.test")
  form.set("phone", "000000000")
  form.set("consentContact", "on")
  form.set("interestLevel", "very_interested")
  form.set("children", JSON.stringify([trialStudent]))
  form.set("referral", "partner:" + partnerId)
  await actions.submitFreeTrialLead({}, form)
  assert.equal(saved.get("parent_leads").source, "Free first session · Test partner")
  assert.equal(saved.get("parent_leads").status, "new")
  assert.equal(saved.get("child_leads")[0].child_age, 16)
  assert.deepEqual(saved.get("child_leads")[0].support_needs, ["igcse_chemistry"])
  assert.equal(saved.get("child_leads")[0].course_or_exam_board, "Cambridge")
  assert.equal(saved.get("timetable_preferences")[0].child_lead_id, "child-test")
  assert.equal(saved.get("timetable_preferences")[0].preferred_frequency, "not_sure")
  await actions.submitLead({}, form)
  assert.equal(saved.get("timetable_preferences")[0].preferred_frequency, "two_days")
  assert.equal(saved.get("parent_leads").source, "landing_page_es")

  for (const invalid of ["", "scout-proel-334", "partner:" + partnerId]) {
    form.set("referral", invalid)
    partnerActive = false
    saved.clear()
    assert.equal((await actions.submitFreeTrialLead({}, form)).success, false)
    assert.equal(saved.size, 0)
  }

  form.set("referral", "google")
  form.set("children", JSON.stringify([{ ...trialStudent, supportNeeds: ["one_to_one"] }]))
  const result = await actions.submitFreeTrialLead({}, form)
  assert.equal(result.success, false)
  assert.equal(saved.size, 0)
})
