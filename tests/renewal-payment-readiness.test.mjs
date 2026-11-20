import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import ts from "typescript"
import { z } from "zod"
import { renewalOfferChanged } from "../lib/admin/renewal-offer-revisions.mjs"

function loadTypescript(path, modules) {
  const exports = {}
  const source = readFileSync(new URL(path, import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  new Function("require", "exports", compiled)((name) => {
    assert.ok(name in modules, "Unexpected module: " + name)
    return modules[name]
  }, exports)
  return exports
}

test("missing family payment migration returns inline feedback before any renewal write", async () => {
  const learnerId = "00000000-0000-4000-8000-000000000001"
  const session = {
    learnerId, learnerName: "Synthetic learner",
    placementId: "standing-place", date: "2026-12-01",
    academyTableId: learnerId, tableNumber: 1, seatNumber: null,
    startsAt: "17:00", durationMinutes: 45, teacherName: null, focus: null,
    pricePlanId: learnerId, pricePlanName: "Private Support",
    priceCents: 4000, replacement: false,
  }
  const writes = []
  const supabase = {
    from(table) {
      return {
        select(columns) {
          if (table === "payment_entitlements") {
            assert.equal(columns, "session_revision")
            return { limit: (count) => {
              assert.equal(count, 0)
              return { error: { code: "42703", message: "column payment_entitlements.session_revision does not exist" } }
            } }
          }
          if (table === "academy_closures") {
            return { lte: () => ({ gte: () => ({ data: [], error: null }) }) }
          }
          assert.equal(table, "renewal_cases")
          return { eq: () => ({ eq: () => ({ single: () => ({
            data: { id: learnerId, status: "awaiting_payment", learner_id: learnerId, selected_sessions: [session] },
          }) }) }) }
        },
        update: () => writes.push(table),
      }
    },
  }
  const familyPayments = loadTypescript("../lib/admin/write-family-paid-sessions.ts", {
    "server-only": {}, "@/lib/paid-period": {},
  })
  const { recordExactRenewalPayment } = loadTypescript("../actions/paid-period.ts", {
    "next/cache": {}, zod: { z },
    "@/lib/admin/write-family-paid-sessions": familyPayments,
    "@/lib/admin/renewal-offer-lock": { withRenewalOfferLock: () => writes.push("renewal lease") },
    "@/lib/admin/renewal-dated-sessions.mjs": {},
    "@/lib/admin/renewal-offer-revisions.mjs": { renewalOfferChanged },
    "@/lib/dated-session-pricing.mjs": { MAX_SESSION_PRICE_CENTS: 1_000_000 },
    "@/lib/admin/family-booking-lock": {},
    "@/lib/auth/require-admin": { requireAdmin: async () => ({ user: { id: learnerId } }) },
    "@/lib/admin/lead-planning-lifecycle.mjs": {},
    "@/lib/email/renewal-email": {},
    "@/lib/delivery-capacity": { assertPaidPeriodCapacity: async () => {} },
    "@/lib/paid-period": {
      sortPaidPeriodSessions: (sessions) => sessions,
      paidPeriodSummary: () => ({ periodStart: session.date, periodEnd: session.date }),
    },
    "@/lib/supabase/service": { supabaseService: () => supabase },
  })
  const form = new FormData()
  form.set("caseId", learnerId)
  form.set("parentLeadId", learnerId)
  form.set("receivedOn", session.date)
  form.set("selectedSessions", JSON.stringify([session]))
  const result = await recordExactRenewalPayment(form)
  assert.match(result.error, /database migration is applied/)
  assert.deepEqual(writes, [])
})
