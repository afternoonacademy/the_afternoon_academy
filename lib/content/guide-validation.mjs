import { slugFromTitle } from "./seo-slug.mjs"

export function draftValidation(input, existingSlugs = {}) {
  const saved=typeof existingSlugs==="string"?{slug_en:existingSlugs}:existingSlugs
  const fields=["title_en","title_es","summary_en","summary_es","body_en","body_es"]
  const values=Object.fromEntries(fields.map(k=>[k,String(input[k]||"").trim()]))
  const slug_en=saved.slug_en || slugFromTitle(values.title_en)
  const slug_es=saved.slug_es || (values.title_es?slugFromTitle(values.title_es):"")
  if(values.title_en.length<4||values.title_en.length>180)return {error:"Enter an English title between 4 and 180 characters."}
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug_en)||slug_en.length>100)return {error:"Please use an English title that produces a valid URL."}
  if(values.title_es.length>180)return {error:"Spanish title must be no longer than 180 characters."}
  if(values.title_es&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug_es))return {error:"Please use a Spanish title that produces a valid Spanish URL."}
  if(["summary_en","summary_es"].some(k=>values[k].length>500))return {error:"Summaries must be no longer than 500 characters."}
  if(["body_en","body_es"].some(k=>values[k].length>30000))return {error:"Article text must be no longer than 30,000 characters."}
  return {value:{...values,slug:slug_en,slug_en,slug_es:slug_es||null}}
}
export function publicationValidation(input) {
  if(!input.slug_en||!input.slug_es)return {error:"Both English and Spanish URLs are required before publishing. Add a Spanish title and save the draft first."}
  const titles=["title_en","title_es"],summaries=["summary_en","summary_es"],bodies=["body_en","body_es"]
  for(const key of titles)if(String(input[key]||"").trim().length<4)return {error:"Both language titles must contain at least 4 characters before publishing."}
  for(const key of summaries)if(String(input[key]||"").trim().length<20)return {error:"Both language summaries must contain at least 20 characters before publishing."}
  for(const key of bodies)if(String(input[key]||"").trim().length<60)return {error:"Both language article bodies must contain at least 60 characters before publishing."}
  return {value:true}
}
