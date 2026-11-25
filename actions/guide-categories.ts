"use server"
import {redirect} from "next/navigation"
import {revalidatePath} from "next/cache"
import {assertCapability} from "@/lib/auth/require-capability"
import {supabaseService} from "@/lib/supabase/service"
import {slugFromTitle} from "@/lib/content/seo-slug.mjs"

export async function addGuideCategory(data:FormData){
  await assertCapability("manage_setup")
  const title_en=String(data.get("title_en")||"").trim()
  const title_es=String(data.get("title_es")||"").trim()
  const slug=slugFromTitle(title_en)
  if(title_en.length<3||title_en.length>100||title_es.length<3||title_es.length>100||slug.length<2)
    throw new Error("Provide English and Spanish category names (3–100 characters).")
  const {error}=await supabaseService().from("academy_guide_categories")
    .insert({slug,title_en,title_es,kind:"public",sort_order:100})
  if(error)throw new Error("Could not create category. It may already exist.")
  revalidatePath("/admin/content")
  revalidatePath("/guide")
  revalidatePath("/es/guia")
  redirect("/admin/content?category_added=1")
}
