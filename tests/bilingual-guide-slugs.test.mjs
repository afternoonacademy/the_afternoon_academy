import test from "node:test"
import assert from "node:assert/strict"
import {draftValidation,publicationValidation} from "../lib/content/guide-validation.mjs"

test("english and spanish titles create independent slugs",()=>{
 const result=draftValidation({title_en:"Helping with Homework",title_es:"Cómo ayudar con los deberes"})
 assert.equal(result.value.slug_en,"helping-with-homework")
 assert.equal(result.value.slug_es,"como-ayudar-con-los-deberes")
 assert.equal(result.value.slug,"helping-with-homework")
})
test("both URLs stay fixed after titles change",()=>{
 const result=draftValidation({title_en:"Better support at home",title_es:"Deberes con calma"},{slug_en:"helping-with-homework",slug_es:"como-ayudar-con-los-deberes"})
 assert.equal(result.value.slug_en,"helping-with-homework")
 assert.equal(result.value.slug_es,"como-ayudar-con-los-deberes")
})
test("Spanish URL can be added to unfinished drafts",()=>{
 const first=draftValidation({title_en:"Homework routines"})
 assert.equal(first.value.slug_es,null)
 const second=draftValidation({title_en:"Homework routines",title_es:"Rutinas para los deberes"},{slug_en:first.value.slug_en})
 assert.equal(second.value.slug_es,"rutinas-para-los-deberes")
})
test("both URL slugs required to publish",()=>{
 assert.match(publicationValidation({slug_en:"homework",title_en:"Homework"}).error,/URLs/)
})
