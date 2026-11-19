import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"

const moveSql = readFileSync(new URL("../supabase/migrations/20261119120000_move_renewal_recurring_slot.sql", import.meta.url), "utf8")
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`
const [learner, parent, renewal, tuesday, thursday, fridayTemplate, table, plan, actor] =
  Array.from({ length: 9 }, (_, index) => id(index + 1))

test("moves a single unpaid recurring slot atomically and keeps history", async (t) => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create table renewal_cases (
        id uuid, parent_lead_id uuid, learner_id uuid, offer_revision int, sent_offer_revision int,
        status text, offer_payment_started_at timestamptz, offer_operation_until timestamptz,
        standing_placement_id uuid, selected_sessions jsonb, selected_session_count int,
        proposed_period_start date, proposed_period_end date, proposed_service_dates jsonb,
        proposed_amount_cents int, proposed_session_price_plan_id uuid,
        draft_subject text, draft_body text, updated_by uuid
      );
      create table standing_placements (
        id uuid, learner_id uuid, weekday int, academy_table_id uuid, table_number int,
        starts_at time, duration_minutes int, teacher_name text, focus text, effective_from date,
        effective_to date, seat_number int, status text, room_code text, session_price_plan_id uuid,
        created_by uuid, updated_by uuid
      );
      create table weekly_table_templates (
        id uuid, weekday int, academy_table_id uuid, table_number int, starts_at time,
        duration_minutes int, teacher_name text, focus text, effective_from date,
        effective_to date, status text, room_code text
      );
      create table accepted_bookings (
        id uuid, weekday int, starts_at time, academy_table_id uuid, table_number int,
        seat_number int, learner_id uuid, parent_lead_id uuid, status text,
        weekly_table_template_id uuid, duration_minutes int, updated_at timestamptz, planned_period_start date, child_lead_id uuid
      );
      create unique index active_seat on accepted_bookings (weekday, starts_at, academy_table_id, seat_number)
      where status in ('session_planned','contacted','accepted_awaiting_payment','paid_active');
      create table place_offers (id uuid, child_lead_id uuid, weekday int, academy_table_id uuid,
        starts_at time, seat_number int, status text, service_period_start date);
      create table child_payment_entitlements (learner_id uuid, status text, period_end date);
      create table academy_closures (starts_on date, ends_on date);
      create table academy_tables (id uuid, seat_capacity int, status text);
      create table learners (id uuid, parent_lead_id uuid, status text, child_lead_id uuid);
      create table delivery_seats (learner_id uuid, delivery_session_id uuid, seat_number int, status text);
      create table delivery_sessions (id uuid, service_date date, starts_at time, academy_table_id uuid);
      create table attendance_records (learner_id uuid, attendance_date date);
    `)
    await db.exec(moveSql)
    const { rows: [privileges] } = await db.query(`
      select
        has_function_privilege('authenticated', 'move_renewal_recurring_slot(uuid,uuid,uuid,uuid,date,integer,uuid)', 'execute') as authenticated,
        has_function_privilege('service_role', 'move_renewal_recurring_slot(uuid,uuid,uuid,uuid,date,integer,uuid)', 'execute') as service
    `)
    assert.deepEqual(privileges, { authenticated: false, service: true })

    const session = (placementId, date, extra = {}) => ({
      placementId, date, learnerId: learner, academyTableId: table, tableNumber: 1,
      startsAt: "17:00", durationMinutes: 50, pricePlanId: plan, priceCents: 2500, replacement: false, ...extra,
    })
    const existingTuesday = session(tuesday, "2090-11-14")
    const earlierThursday = session(thursday, "2090-11-09")
    const exception = session(thursday, "2090-11-18", { replacement: true, timeTbc: true })
    const saved = [
      earlierThursday, existingTuesday, session(thursday, "2090-11-16", { actualStartsAt: "18:00" }),
      exception, session(thursday, "2090-11-23"),
    ]

    await db.exec(`
      insert into learners values ('${learner}', '${parent}', 'active');
      insert into academy_tables values ('${table}', 1, 'active');
      insert into standing_placements
        (id, learner_id, weekday, academy_table_id, table_number, starts_at, duration_minutes,
          effective_from, seat_number, status, room_code, session_price_plan_id)
      values
        ('${tuesday}', '${learner}', 2, '${table}', 1, '17:00', 50, '2090-09-01', 1, 'active', 'TAA1', '${plan}'),
        ('${thursday}', '${learner}', 4, '${table}', 1, '17:00', 50, '2090-09-01', 1, 'active', 'TAA1', '${plan}');
      insert into weekly_table_templates
        (id, weekday, academy_table_id, table_number, starts_at, duration_minutes, effective_from, status, room_code)
      values ('${fridayTemplate}', 5, '${table}', 1, '17:00', 50, '2090-09-01', 'active', 'TAA1');
      insert into accepted_bookings (id, weekday, starts_at, academy_table_id, seat_number, learner_id, parent_lead_id, status)
      values
        ('${id(10)}', 2, '17:00', '${table}', 1, '${learner}', '${parent}', 'paid_active'),
        ('${id(11)}', 4, '17:00', '${table}', 1, '${learner}', '${parent}', 'paid_active');
      insert into attendance_records values ('${learner}', '2090-11-09');
      insert into child_payment_entitlements values ('${learner}', 'paid', '2090-11-10');
      insert into academy_closures values ('2090-11-24', '2090-11-24');
    `)
    await db.query(`
      insert into renewal_cases (id, parent_lead_id, learner_id, offer_revision, sent_offer_revision,
         status, standing_placement_id, selected_sessions, selected_session_count)
      values ($1, $2, $3, 2, 2, 'awaiting_payment', $4, $5::jsonb, 5)
    `, [renewal, parent, learner, thursday, JSON.stringify(saved)])

    const move = (revision = 2, parentId = parent) => db.query(
      "select move_renewal_recurring_slot($1,$2,$3,$4,$5,$6,$7)",
      [renewal, parentId, thursday, fridayTemplate, "2090-11-16", revision, actor],
    )
    const fetchOffer = async () => (await db.query("select * from renewal_cases")).rows[0]

    await t.test("rejects a different family, a stale offer and a concurrent send or payment", async () => {
      await assert.rejects(move(2, id(20)), /Refresh/)
      await assert.rejects(move(1), /Refresh/)
      await db.exec("update renewal_cases set offer_operation_until = now() + interval '1 hour'")
      await assert.rejects(move(), /Refresh/)
      await db.exec("update renewal_cases set offer_operation_until = null, offer_payment_started_at = now()")
      await assert.rejects(move(), /Refresh/)
      await db.exec("update renewal_cases set offer_payment_started_at = null")
      assert.deepEqual((await fetchOffer()).selected_sessions, saved)
    })

    await t.test("fails without writes if the seat is taken or attendance exists", async () => {
      await db.exec(`
        insert into accepted_bookings (id, weekday, starts_at, academy_table_id, seat_number, status)
        values ('${id(12)}', 5, '17:00', '${table}', 1, 'contacted')
      `)
      await assert.rejects(move(), /no recurring seat/)
      assert.equal((await db.query("select count(*)::int as count from standing_placements")).rows[0].count, 2)
      await db.exec(`delete from accepted_bookings where id = '${id(12)}'`)
      await db.exec(`
        insert into place_offers (id, weekday, starts_at, academy_table_id, seat_number, status)
        values ('${id(12)}', 5, '17:00', '${table}', 1, 'sent')
      `)
      await assert.rejects(move(), /no recurring seat/)
      await db.exec("delete from place_offers")
      await db.exec(`insert into attendance_records values ('${learner}', '2090-11-16')`)
      await assert.rejects(move(), /attendance record/)
      await db.exec("delete from attendance_records where attendance_date = '2090-11-16'")
      assert.deepEqual((await fetchOffer()).selected_sessions, saved)
    })

    await t.test("moves upcoming Thursdays to Fridays and keeps Tuesday, past dates and exceptions", async () => {
      await move()
      const updated = await fetchOffer()
      assert.equal(updated.offer_revision, 3)
      assert.equal(updated.sent_offer_revision, 2)
      assert.equal(updated.status, "awaiting_payment")
      assert.equal(updated.selected_session_count, 4)
      assert.equal(updated.proposed_amount_cents, 10000)
      assert.deepEqual(updated.proposed_service_dates, ["2090-11-09", "2090-11-14", "2090-11-17", "2090-11-18"])
      assert.deepEqual(updated.selected_sessions[0], earlierThursday)
      assert.deepEqual(updated.selected_sessions[1], existingTuesday)
      assert.equal(updated.selected_sessions[2].placementId, updated.standing_placement_id)
      assert.equal(updated.selected_sessions[2].actualStartsAt, undefined)
      assert.deepEqual(updated.selected_sessions[3], exception)
      const { rows: bookings } = await db.query("select weekday from accepted_bookings order by weekday")
      assert.deepEqual(bookings.map((booking) => booking.weekday), [2, 5])
      const { rows: places } = await db.query("select weekday, effective_to::text from standing_placements order by weekday")
      assert.deepEqual(places, [
        { weekday: 2, effective_to: null }, { weekday: 4, effective_to: "2090-11-15" }, { weekday: 5, effective_to: null },
      ])
      const bookFormerSlot = (start) => db.query(`
        insert into accepted_bookings
          (id, weekday, starts_at, academy_table_id, seat_number, status, planned_period_start)
        values ($1, 4, '17:00', $2, 1, 'session_planned', $3)
      `, [id(13), table, start])
      await assert.rejects(bookFormerSlot("2090-11-09"), /seat is still held/)
      await bookFormerSlot("2090-11-16")
      await assert.rejects(move(), /Refresh/)
    })
  } finally {
    await db.close()
  }
})
