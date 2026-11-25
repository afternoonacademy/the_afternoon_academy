import test from "node:test"
import assert from "node:assert/strict"
import {draftValidation,publicationValidation} from "../lib/content/guide-validation.mjs"

const unfinished={title_en:"Helping with Homework",title_es:"",summary_en:"",summary_es:"",body_en:"Short draft",body_es:""}
test("saving draft permits incomplete Spanish and short article bodies",()=>{
 const r=draftValidation(unfinished)
 assert.equal(r.error,undefined)
 assert.equal(r.value.slug_en,"helping-with-homework")
 assert.equal(r.value.slug_es,null)
})
test("saved English URL remains stable after title edits",()=>{
 const r=draftValidation({...unfinished,title_en:"A Better English Headline"},{slug_en:"helping-with-homework"})
 assert.equal(r.value.slug_en,"helping-with-homework")
})
test("draft requires an English title",()=>{
 assert.match(draftValidation({...unfinished,title_en:"Hi"}).error,/English title/)
})
test("publication validates both localized URLs and both complete languages",()=>{
 assert.match(publicationValidation(unfinished).error,/URLs/)
 const slugs={...unfinished,slug_en:"helping-with-homework",slug_es:"ayuda-con-los-deberes"}
 assert.match(publicationValidation(slugs).error,/titles/)
 const titles={...slugs,title_es:"Ayuda con los deberes"}
 assert.match(publicationValidation(titles).error,/summaries/)
 const summaries={...titles,summary_en:"A practical guide for parents managing homework",summary_es:"Una guía práctica para las familias con los deberes"}
 assert.match(publicationValidation(summaries).error,/article bodies/)
 const complete={...summaries,body_en:"This paragraph explains how parents can support daily homework with calm routines.",body_es:"Este texto explica cómo las familias pueden ayudar con los deberes diarios y las rutinas."}
 assert.equal(publicationValidation(complete).error,undefined)
})
test("draft respects maximum lengths",()=>{
 assert.match(draftValidation({...unfinished,body_en:"x".repeat(30001)}).error,/30,000/)
})
