import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"
import {
  hasSentRenewalOffer,
  renewalOfferChanged,
  renewalOfferEmailKey,
} from "../lib/admin/renewal-offer-revisions.mjs"

const session = {
  placementId: "place",
  date: "2026-11-19",
  academyTableId: "table",
  tableNumber: 1,
  startsAt: "17:00",
  pricePlanId: "plan",
  priceCents: 2500,
}

test("offer changes track dates, planned times and price, ignoring legacy metadata differences", () => {
  const second = { ...session, date: "2026-11-26" }
  assert.equal(renewalOfferChanged([session, second], [second, { ...session, timeTbc: false }]), false)
  assert.equal(renewalOfferChanged([session, second], [session]), true)
  for (const difference of [
    { date: "2026-11-24" },
    { priceCents: 3000 },
    { pricePlanId: "other-plan" },
    { actualStartsAt: "18:00" },
    { timeTbc: true },
  ]) {
    assert.equal(renewalOfferChanged([session], [{ ...session, ...difference }]), true)
  }
})

test("legacy sent offers retain their key and each new saved revision can be sent once", () => {
  const oldOffer = { offer_revision: 0, sent_offer_revision: null, email_sent_at: "sent-at" }
  assert.equal(renewalOfferEmailKey("case", 0), "renewal-case")
  assert.equal(hasSentRenewalOffer(oldOffer), true)
  const revision = { ...oldOffer, offer_revision: 1 }
  assert.equal(renewalOfferEmailKey("case", 1), "renewal-case-v1")
  assert.equal(hasSentRenewalOffer(revision), false)
  assert.equal(hasSentRenewalOffer({ ...revision, sent_offer_revision: 1 }), true)
  assert.equal(hasSentRenewalOffer({ ...revision, offer_revision: 2, sent_offer_revision: 1 }), false)
})

test("migration preserves pre-existing offers and enforces valid revision ordering", async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create table public.renewal_cases (id integer primary key, email_sent_at timestamptz);
      insert into public.renewal_cases values (1, now());
    `)
    await db.exec(readFileSync(
      new URL("../supabase/migrations/20261119101500_renewal_offer_revisions.sql", import.meta.url),
      "utf8",
    ))
    const { rows: [offer] } = await db.query("select * from public.renewal_cases")
    assert.equal(hasSentRenewalOffer(offer), true)
    assert.equal(offer.offer_operation_until, null)
    await assert.rejects(db.exec("update public.renewal_cases set sent_offer_revision = 1"), /check constraint/)
    await db.exec("update public.renewal_cases set offer_revision = 1, sent_offer_revision = 1")
  } finally {
    await db.close()
  }
})

test("sending a revised offer preserves the earlier email and rejects stale or duplicate sends", async () => {
  const { createRequire } = await import("node:module")
  const { default: ts } = await import("typescript")
  const url = new URL("../actions/renewals.ts", import.meta.url)
  const require = createRequire(url)
  const helper = await import("../lib/admin/renewal-offer-revisions.mjs")
  const compiled = ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  const id = "653fd2cc-1e22-479a-a8a4-09c507487853"
  const parentId = "25889227-dfa6-4e6b-83c8-806561275e98"
  const renewal = { id, status: "awaiting_payment", offer_revision: 1, sent_offer_revision: null, email_sent_at: "2026-11-01", selected_session_count: 2 }
  const oldEmail = { id: "older", idempotency_key: renewalOfferEmailKey(id, 0), status: "sent", body_text: "Original dates" }
  const logs = [oldEmail]
  const providerCalls = []
  let role = "teacher"
  let failCaseUpdate = false
  function from(table) {
    let data = table === "renewal_cases" ? [renewal] : table === "parent_leads" ? [{ email: "parent@example.invalid" }] : logs
    let update
    const query = {
      select() { return query },
      eq(column, value) {
        if (["idempotency_key", "offer_revision"].includes(column) || (column === "id" && table === "email_delivery_log")) {
          data = data.filter((row) => row[column] === value)
        }
        return query
      },
      in(column, values) { data = data.filter((row) => values.includes(row[column])); return query },
      update(value) { update = value; return query },
      insert(value) {
        assert.equal(role, "admin")
        const row = { ...value, id: "revised", status: "pending" }
        logs.push(row)
        data = [row]
        return query
      },
      result() {
        if (table === "renewal_cases" && update && failCaseUpdate) return { error: { code: "synthetic-error" } }
        if (update) data.forEach((row) => Object.assign(row, update))
        return { data: data[0] ?? null, error: null }
      },
      async single() { return query.result() },
      async maybeSingle() { return query.result() },
      then(resolve) { return Promise.resolve(query.result()).then(resolve) },
    }
    return query
  }
  const overrides = {
    "next/cache": { revalidatePath() {} },
    "@/lib/auth/require-admin": { async requireAdmin() {
      if (role !== "admin") throw new Error("Unauthorized")
      return { user: { id: "admin" } }
    } },
    "@/lib/admin/renewal-offer-lock": { async withRenewalOfferLock(_client, _row, work) { await work() } },
    "@/lib/admin/renewal-offer-revisions.mjs": helper,
    "@/lib/supabase/service": { supabaseService() { return { from } } },
    "@/lib/delivery-capacity": {},
    "@/lib/email/academy-period-email.mjs": {},
    "@/lib/email/parent-template-contract.mjs": { renewalTemplateContract: {} },
    "@/lib/resend": { getResend() { return { emails: { async send(email, options) {
      providerCalls.push([email, options])
      return { data: { id: "provider-id" } }
    } } } } },
  }
  const actions = {}
  new Function("require", "exports", compiled)((name) => overrides[name] || require(name), actions)
  const form = new FormData()
  form.set("caseId", id)
  form.set("parentLeadId", parentId)
  form.set("offerRevision", "0")
  form.set("subject", "Revised offer")
  form.set("body", "Newly agreed dates")
  await assert.rejects(actions.sendRenewalEmail(form), /Unauthorized/)
  role = "admin"
  await assert.rejects(actions.sendRenewalEmail(form), /plan changed/)
  assert.equal(logs.length, 1)

  form.set("offerRevision", "1")
  failCaseUpdate = true
  await assert.rejects(actions.sendRenewalEmail(form), /renewal status could not be updated/)
  assert.equal(logs[1].status, "sent")
  failCaseUpdate = false
  await actions.sendRenewalEmail(form)
  await assert.rejects(actions.sendRenewalEmail(form), /already been sent/)
  assert.equal(providerCalls.length, 1)
  assert.equal(providerCalls[0][1].idempotencyKey, renewalOfferEmailKey(id, 1))
  assert.equal(logs.length, 2)
  assert.equal(logs[0].body_text, "Original dates")
  assert.equal(logs[1].body_text, "Newly agreed dates")
  assert.equal(renewal.sent_offer_revision, 1)
})
