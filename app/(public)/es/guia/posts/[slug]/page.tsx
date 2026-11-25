import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { publishedGuidePost } from "@/lib/content/guide-posts"
import { GuidePostArticle } from "@/components/discovery/guide-post-article"
export const dynamic="force-dynamic"
type Props={params:Promise<{slug:string}>}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;const p=await publishedGuidePost(slug);if(!p)return {robots:{index:false}}
  return {title:p.title_es+" | The Afternoon Academy",description:p.summary_es.slice(0,160),alternates:{canonical:"/es/guia/posts/"+slug,languages:{en:"/guide/posts/"+slug,es:"/es/guia/posts/"+slug}}}
}
export default async function Page({params}:Props){const {slug}=await params;const p=await publishedGuidePost(slug);if(!p)notFound();return <GuidePostArticle post={p} lang="es"/>}
