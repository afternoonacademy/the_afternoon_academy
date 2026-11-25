"use client"

import { useState } from "react"
import { slugFromTitle } from "@/lib/content/seo-slug.mjs"

type Props = { initialTitle?: string; existingSlug?: string }

export function GuideTitleFields({initialTitle="",existingSlug=""}:Props) {
  const [title,setTitle]=useState(initialTitle)
  const slug=existingSlug || slugFromTitle(title)
  return <div className="space-y-4">
    <label className="block space-y-1 text-sm font-semibold" htmlFor="guide-title-en">
      <span>English article title</span>
      <input id="guide-title-en" name="title_en" required minLength={4} maxLength={180}
        value={title} onChange={event=>setTitle(event.target.value)}
        className="block w-full rounded-xl border bg-white px-3 py-2 text-sm"/>
    </label>
    <div className="space-y-1">
      <label htmlFor="guide-url-slug" className="block text-sm font-semibold">Article URL (generated automatically)</label>
      <input id="guide-url-slug" readOnly value={slug} aria-describedby="guide-url-help"
        className="block w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-700"/>
      <input type="hidden" name="slug" value={slug}/>
      <p id="guide-url-help" className="text-xs text-muted-foreground">
        {existingSlug ? "This URL is locked to preserve existing links and search rankings." :
        "Generated from the English title. Accents and punctuation are removed; words use hyphens. The URL is locked after the first save."}
      </p>
      {slug&&<p className="break-all text-xs text-muted-foreground">English: /guide/posts/{slug} · Español: /es/guia/posts/{slug}</p>}
    </div>
  </div>
}
