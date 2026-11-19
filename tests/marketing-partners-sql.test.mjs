import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"

test("marketing configuration is empty by default and writable only by the service role", async () => {
  const db = new PGlite()
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls;")
    const migration = new URL("../supabase/migrations/20261119125552_academy_marketing_partners.sql", import.meta.url)
    await db.exec(await readFile(migration, "utf8"))
    for (const role of ["anon", "authenticated"]) {
      await db.exec("set role " + role)
      await assert.rejects(db.exec("select * from public.academy_marketing_partners"), /permission denied/)
      await assert.rejects(db.exec("insert into public.academy_marketing_partners (name) values ('Test club')"), /permission denied/)
      await db.exec("reset role")
    }
    await db.exec("set role service_role")
    const table = "public.academy_marketing_partners"
    assert.equal((await db.query(`select * from ${table}`)).rows.length, 0)
    await db.exec(`insert into ${table} (name) values ('Test club')`)
    await assert.rejects(db.exec(`insert into ${table} (name) values ('TEST CLUB')`), /duplicate key/)
    await db.exec(`update ${table} set active = false where name = 'Test club'`)
    assert.equal((await db.query(`select * from ${table} where active`)).rows.length, 0)
    await assert.rejects(db.exec(`delete from ${table}`), /permission denied/)
  } finally {
    await db.close()
  }
})
