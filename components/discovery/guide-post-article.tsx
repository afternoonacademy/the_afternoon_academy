import { siteImage } from "@/lib/media/taa-cloudinary.mjs"
import Link from "next/link"
import Image from "next/image"
import { DiscoveryLayout,AcademyCTA } from "@/components/discovery/discovery-layout"
import type { GuidePost } from "@/lib/content/guide-posts"
export function GuidePostArticle({post,lang}:{post:GuidePost;lang:"en"|"es"}){
  const prefix=lang==="en"?"/guide":"/es/guia"
  const other=lang==="en"?"/es/guia":"/guide"
  const title=lang==="en"?post.title_en:post.title_es
  const summary=lang==="en"?post.summary_en:post.summary_es
  const body=lang==="en"?post.body_en:post.body_es
  return <DiscoveryLayout lang={lang} switchHref={other+"/posts/"+post.slug}>
    <Link href={prefix} className="text-sm underline">{lang==="en"?"Back to family guides":"Volver a las guías"}</Link>
    <article className="mx-auto mt-8 max-w-3xl">
      <p className="brand-kicker">{post.category}</p>
      <h1 className="mt-3 text-4xl font-bold">{title}</h1><p className="brand-muted mt-5 text-lg">{summary}</p>
      {post.image_path&&<Image src={siteImage(post.image_path)} width={1200} height={800} sizes="(min-width: 768px) 720px, 100vw" className="mt-8 h-auto w-full rounded-2xl" alt=""/>}
      <div className="mt-10 space-y-6 leading-8">{body.split(/\n\s*\n/).filter(Boolean).map((paragraph,i)=><p key={i} className="whitespace-pre-line">{paragraph}</p>)}</div>
      {post.source_url&&<a className="mt-8 block underline" href={post.source_url} target="_blank" rel="noopener noreferrer">{lang==="en"?"Research and source":"Investigación y fuente"}</a>}
      <p className="brand-muted mt-8 text-sm">{lang==="en"?"General educational guidance; TAA does not assess or diagnose children through these articles.":"Información educativa general; TAA no evalúa ni diagnostica a menores mediante estos artículos."}</p>
    </article><AcademyCTA lang={lang}/>
  </DiscoveryLayout>
}
