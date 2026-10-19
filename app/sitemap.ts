import type { MetadataRoute } from "next"
import { schools } from "@/lib/discovery/content"
export default function sitemap():MetadataRoute.Sitemap{
const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://theafternoonacademy.com").replace(/\/$/,"")
const paths=["/","/es","/guide","/es/guia",...schools.filter(s=>s.verified).flatMap(s=>[`/guide/schools/${s.slug}`,`/es/guia/schools/${s.slug}`])]
return paths.map(path=>({url:base+path,changeFrequency:"monthly",priority:path==="/"||path==="/es"?1:path==="/guide"||path==="/es/guia"?.8:.6}))
}
