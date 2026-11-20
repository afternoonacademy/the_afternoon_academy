import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"

import { datedSessionPrice, parseSessionPrice, seatServiceKey, seatServiceNames } from "../lib/dated-session-pricing.mjs"
import { renewalOfferChanged } from "../lib/admin/renewal-offer-revisions.mjs"
import { formatAcademyServiceGroups } from "../lib/email/academy-period-email.mjs"

test("EUR amounts use exact cents and require an explicit amount for a free date", () => {
  assert.equal(parseSessionPrice("0"), 0)
  assert.equal(parseSessionPrice("35,25"), 3525)
  assert.equal(parseSessionPrice("25.01"), 2501)
  for (const value of ["", "-1", "12.345", "1e2", "10000.01", null]) {
    assert.equal(parseSessionPrice(value), null)
  }
})

test("a mixed offer preserves its agreed EUR 125 after reload and a catalogue change", () => {
  const homework = { id: "homework", name: "General Homework", price_cents: 2500 }
  const privateSupport = { id: "private", name: "Private Support", price_cents: 4000 }
  const draft = [homework, homework, privateSupport, privateSupport].map((plan, index) => ({
    date: `2026-12-${10 + index}`,
    startsAt: "17:00",
    academyTableId: "academy-table",
    placementId: "recurring-place",
    ...datedSessionPrice({ pricePlanId: plan.id, priceCents: index === 3 ? 3500 : plan.price_cents }, null, plan),
  }))
  const saved = JSON.parse(JSON.stringify(draft))
  const repricedCatalogue = { ...privateSupport, name: "New catalogue label", price_cents: 5000 }
  const restored = saved.map((session) => ({
    ...session,
    ...datedSessionPrice(session, session, session.pricePlanId === homework.id ? homework : repricedCatalogue),
  }))
  assert.equal(renewalOfferChanged(saved, restored), false)
  assert.equal(restored.reduce((total, session) => total + session.priceCents, 0), 12500)
  assert.match(formatAcademyServiceGroups(restored), /Private Support\n[^\n]+€40\.00\n[^\n]+€35\.00/)
  const services = seatServiceNames(saved[3].date, [{ learner_id: "learner", selected_sessions: restored }])
  assert.deepEqual([...services.values()], ["Private Support"])
  assert.equal(services.get(seatServiceKey("learner", "academy-table", "17:00:00")), "Private Support")
  assert.throws(() => datedSessionPrice({ pricePlanId: "inactive", priceCents: 100 }, null, undefined), /active service/)
})

test("family payment revision rejects a sibling's stale update and keeps receipt fields", async () => {
  const db = new PGlite()
  try {
    await db.exec(`create role anon; create role authenticated;
      create table public.parent_leads (id integer primary key);
      create table public.payment_entitlements (id integer primary key, selected_sessions jsonb, amount_cents integer);
      insert into public.payment_entitlements values (1, '["first child"]', 3500);`)
    await db.exec(await readFile(new URL("../supabase/migrations/20261120170426_family_payment_session_revision.sql", import.meta.url), "utf8"))
    const first = await db.query("update payment_entitlements set selected_sessions = '[\"first child\", \"second child\"]' where id = 1 and session_revision = 0 returning id")
    assert.equal(first.rows.length, 1)
    const stale = await db.query("update payment_entitlements set selected_sessions = '[\"first child\", \"third child\"]' where id = 1 and session_revision = 0 returning id")
    assert.equal(stale.rows.length, 0)
    const actual = await db.query("select selected_sessions, amount_cents from payment_entitlements")
    assert.deepEqual(actual.rows, [{ selected_sessions: ["first child", "second child"], amount_cents: 3500 }])
  } finally {
    await db.close()
  }
})
