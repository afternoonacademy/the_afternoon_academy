import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { publishedGuidePost } from "@/lib/content/guide-posts"
import { GuidePostArticle } from "@/components/discovery/guide-post-article"
export const dynamic="force-dynamic"
type Props={params:Promise<{slug:string}>}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;const p=await publishedGuidePost(slug);if(!p)return {robots:{index:false}}
  return {title:p.title_en+" | The Afternoon Academy",description:p.summary_en.slice(0,160),alternates:{canonical:"/guide/posts/"+slug,languages:{en:"/guide/posts/"+slug,es:"/es/guia/posts/"+slug}}}
}
export default async function Page({params}:Props){const {slug}=await params;const p=await publishedGuidePost(slug);if(!p)notFound();return <GuidePostArticle post={p} lang="en"/>}
