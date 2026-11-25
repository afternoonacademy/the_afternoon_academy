import test from "node:test"
import assert from "node:assert/strict"
import {slugFromTitle} from "../lib/content/seo-slug.mjs"
import {roleHasCapability} from "../lib/auth/capabilities.mjs"
test("category slugs are predictable",()=>assert.equal(slugFromTitle("Exam Preparation"),"exam-preparation"))
test("editor category management is admin-only",()=>{
  assert.equal(roleHasCapability("admin","manage_setup"),true)
  assert.equal(roleHasCapability("teacher","manage_setup"),false)
  assert.equal(roleHasCapability("parent","manage_setup"),false)
})
