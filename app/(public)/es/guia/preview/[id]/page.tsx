import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireCapability } from "@/lib/auth/require-capability"
import { guidePostForPreview } from "@/lib/content/guide-posts"
import { GuidePostArticle } from "@/components/discovery/guide-post-article"

export const dynamic="force-dynamic"
export const metadata:Metadata={robots:{index:false,follow:false}}
export default async function Page({params}:{params:Promise<{id:string}>}){
  await requireCapability("manage_setup")
  const {id}=await params
  const post=await guidePostForPreview(id)
  if(!post)notFound()
  return <div>
    <div className="mx-auto max-w-4xl rounded-xl border border-amber-300 bg-amber-50 p-3 text-center text-sm font-semibold text-amber-950">
      Vista previa privada · Versión guardada · No publicada
    </div>
    <GuidePostArticle post={post} lang="es"/>
  </div>
}
