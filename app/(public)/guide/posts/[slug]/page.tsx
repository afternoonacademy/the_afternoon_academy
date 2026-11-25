import type {Metadata} from "next"
import {notFound,permanentRedirect} from "next/navigation"
import {publishedGuidePost,localizedGuideSlug} from "@/lib/content/guide-posts"
import {GuidePostArticle} from "@/components/discovery/guide-post-article"
export const dynamic="force-dynamic"
type Props={params:Promise<{slug:string}>}
const thisRoot="/guide"
const otherRoot="/es/guia"
const language="en" as const
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params
  const post=await publishedGuidePost(slug,language)
  if(!post)return {robots:{index:false}}
  const canonical=thisRoot+"/posts/"+localizedGuideSlug(post,language)
  return {title:post.title_en+" | The Afternoon Academy",description:post.summary_en.slice(0,160),
    alternates:{canonical,languages:{en:"/guide/posts/"+localizedGuideSlug(post,"en"),es:"/es/guia/posts/"+localizedGuideSlug(post,"es")}}}
}
export default async function Page({params}:Props){
  const {slug}=await params
  const post=await publishedGuidePost(slug,language)
  if(!post)notFound()
  const correctSlug=localizedGuideSlug(post,language)
  if(slug!==correctSlug)permanentRedirect(thisRoot+"/posts/"+correctSlug)
  return <GuidePostArticle post={post} lang={language}/>
}
