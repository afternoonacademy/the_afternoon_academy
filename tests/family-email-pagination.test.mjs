import assert from "node:assert/strict"
import test from "node:test"

import {
  FAMILY_EMAIL_PAGE_SIZE,
  buildFamilyEmailCursorFilter,
  decodeFamilyEmailCursor,
  encodeFamilyEmailCursor,
  pageFamilyEmailRows,
} from "../lib/admin/family-email-history.mjs"

const row = (id, created_at) => ({ id, created_at })

test("family email page size is 25", () => {
  assert.equal(FAMILY_EMAIL_PAGE_SIZE, 25)
})

test("family email cursor round trips timestamp and id", () => {
  const value = {
    createdAt: "2026-10-07T09:00:00.000Z",
    id: "11111111-1111-4111-8111-111111111111",
  }
  assert.deepEqual(decodeFamilyEmailCursor(encodeFamilyEmailCursor(value)), value)
})

test("invalid cursors fail closed", () => {
  assert.throws(() => decodeFamilyEmailCursor("not-a-valid-cursor"), /Invalid family email cursor/)
})

test("cursor filter continues before timestamp and then before id on ties", () => {
  const filter = buildFamilyEmailCursorFilter({
    createdAt: "2026-10-07T09:00:00.000Z",
    id: "11111111-1111-4111-8111-111111111111",
  })
  assert.match(filter, /created_at\.lt\.2026-10-07T09:00:00\.000Z/)
  assert.match(filter, /created_at\.eq\.2026-10-07T09:00:00\.000Z/)
  assert.match(filter, /id\.lt\.11111111-1111-4111-8111-111111111111/)
})

test("page returns 25 rows and a cursor from the 25th row", () => {
  const rows = Array.from({ length: 26 }, (_, index) =>
    row(`${String(index + 1).padStart(8, "0")}-1111-4111-8111-111111111111`, `2026-10-${String(31-index).padStart(2,"0")}T09:00:00.000Z`),
  )
  const result = pageFamilyEmailRows(rows)
  assert.equal(result.items.length, 25)
  assert.equal(result.hasMore, true)
  assert.deepEqual(decodeFamilyEmailCursor(result.nextCursor), {
    createdAt: result.items[24].created_at,
    id: result.items[24].id,
  })
})

test("same timestamp rows remain distinct in cursor pagination", () => {
  const rows = [
    row("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "2026-10-07T09:00:00.000Z"),
    row("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "2026-10-07T09:00:00.000Z"),
  ]
  const result = pageFamilyEmailRows(rows, 1)
  assert.equal(result.items[0].id, rows[0].id)
  assert.deepEqual(decodeFamilyEmailCursor(result.nextCursor), {
    createdAt: rows[0].created_at,
    id: rows[0].id,
  })
})
