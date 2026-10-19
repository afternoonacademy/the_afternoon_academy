import type { MetadataRoute } from "next"
import { schools, sections } from "@/lib/discovery/content"
export default function sitemap():MetadataRoute.Sitemap{
const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://theafternoonacademy.com").replace(/\/$/,"")
const paths=["/","/es","/guide","/es/guia",...schools.filter(s=>s.verified).flatMap(s=>[`/guide/schools/${s.slug}`,`/es/guia/schools/${s.slug}`]),...Object.entries(sections).flatMap(([section,items])=>items.flatMap(item=>[`/guide/${section}/${item.slug}`,`/es/guia/${section}/${item.slug}`]))]
return paths.map(path=>({url:base+path,changeFrequency:"monthly",priority:path==="/"||path==="/es"?1:path.endsWith("/guide")||path.endsWith("/guia")?.8:.6}))
}
