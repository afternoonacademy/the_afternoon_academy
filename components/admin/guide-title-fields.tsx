"use client"
import {useState} from "react"
import {slugFromTitle} from "@/lib/content/seo-slug.mjs"
type Props={initialEnglish?:string;initialSpanish?:string;existingEnglishSlug?:string;existingSpanishSlug?:string}
export function GuideTitleFields({initialEnglish="",initialSpanish="",existingEnglishSlug="",existingSpanishSlug=""}:Props){
  const [en,setEn]=useState(initialEnglish)
  const [es,setEs]=useState(initialSpanish)
  const englishSlug=existingEnglishSlug||slugFromTitle(en)
  const spanishSlug=existingSpanishSlug||(es?slugFromTitle(es):"")
  const input="w-full rounded-xl border bg-white px-3 py-2 text-sm"
  const readonly="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-700"
  return <section className="grid gap-5 md:grid-cols-2" aria-label="Bilingual article titles and URLs">
    <div className="space-y-3">
      <label className="block space-y-1 text-sm font-semibold" htmlFor="guide-title-en">English title
        <input id="guide-title-en" name="title_en" required minLength={4} maxLength={180} className={input} value={en} onChange={e=>setEn(e.target.value)}/>
      </label>
      <label className="block space-y-1 text-sm font-semibold" htmlFor="guide-url-en">English URL — automatic
        <input id="guide-url-en" readOnly className={readonly} value={englishSlug} aria-describedby="guide-slug-note"/>
      </label>
      <p className="break-all text-xs text-muted-foreground">/guide/posts/{englishSlug||"..."}</p>
    </div>
    <div className="space-y-3">
      <label className="block space-y-1 text-sm font-semibold" htmlFor="guide-title-es">Título en español
        <input id="guide-title-es" name="title_es" maxLength={180} className={input} value={es} onChange={e=>setEs(e.target.value)}/>
      </label>
      <label className="block space-y-1 text-sm font-semibold" htmlFor="guide-url-es">URL en español — automática
        <input id="guide-url-es" readOnly className={readonly} value={spanishSlug} aria-describedby="guide-slug-note"/>
      </label>
      <p className="break-all text-xs text-muted-foreground">/es/guia/posts/{spanishSlug||"..."}</p>
    </div>
    <p id="guide-slug-note" className="text-xs text-muted-foreground md:col-span-2">
      Each language gets its own automatically generated URL. Once saved, each URL is locked to preserve shared links. Spanish title and URL can be added to an unfinished draft later.
    </p>
  </section>
}
