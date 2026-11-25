import { slugFromTitle } from "./seo-slug.mjs"

export function draftValidation(input, existingSlug="") {
  const fields=["title_en","title_es","summary_en","summary_es","body_en","body_es"]
  const values=Object.fromEntries(fields.map(k=>[k,String(input[k]||"").trim()]))
  const slug=existingSlug || slugFromTitle(values.title_en)
  if(values.title_en.length<4||values.title_en.length>180) return {error:"Enter an English title between 4 and 180 characters."}
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>100) return {error:"Please use an English title that can create a valid URL."}
  if(values.title_es.length>180) return {error:"Spanish title must be no longer than 180 characters."}
  if(["summary_en","summary_es"].some(k=>values[k].length>500))return {error:"Summaries must be no longer than 500 characters."}
  if(["body_en","body_es"].some(k=>values[k].length>30000))return {error:"Article text must be no longer than 30,000 characters."}
  return {value:{...values,slug}}
}

export function publicationValidation(input) {
  const titles=["title_en","title_es"]
  const summaries=["summary_en","summary_es"]
  const bodies=["body_en","body_es"]
  for(const key of titles)if(String(input[key]||"").trim().length<4)return {error:"Both English and Spanish titles must contain at least 4 characters before publishing."}
  for(const key of summaries)if(String(input[key]||"").trim().length<20)return {error:"Both English and Spanish summaries must contain at least 20 characters before publishing."}
  for(const key of bodies)if(String(input[key]||"").trim().length<60)return {error:"Both English and Spanish article bodies must contain at least 60 characters before publishing."}
  return {value:true}
}
