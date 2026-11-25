import test from "node:test"
import assert from "node:assert/strict"
import {slugFromTitle} from "../lib/content/seo-slug.mjs"

test("new articles get compact human-readable URLs from English titles",()=>{
  assert.equal(slugFromTitle("How to Help With Homework?"),"how-to-help-with-homework")
  assert.equal(slugFromTitle("  Learning at Home — A Parent's Guide!  "),"learning-at-home-a-parent-s-guide")
  assert.equal(slugFromTitle("Café & Educación: Español"),"cafe-educacion-espanol")
})
test("slug generation prevents punctuation-only and overly long paths",()=>{
  assert.equal(slugFromTitle("!!"),"")
  assert.ok(slugFromTitle("A very long title ".repeat(20)).length<=95)
  assert.ok(!slugFromTitle("A very long title ".repeat(20)).endsWith("-"))
})
