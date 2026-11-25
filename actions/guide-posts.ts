"use server"
import {redirect} from "next/navigation"
import {revalidatePath} from "next/cache"
import {assertCapability} from "@/lib/auth/require-capability"
import {supabaseService} from "@/lib/supabase/service"
import {sections} from "@/lib/discovery/content"
import {isApprovedArticleImage} from "@/lib/media/taa-cloudinary.mjs"
import {draftValidation,publicationValidation} from "@/lib/content/guide-validation.mjs"

type Feedback={error:string|null}
const asText=(data:FormData,key:string)=>String(data.get(key)||"").trim()
const errorMessage=(error:unknown)=>error instanceof Error?error.message:"Unexpected error. Please try again."

export async function saveGuidePost(_state:Feedback,form:FormData):Promise<Feedback>{
  await assertCapability("manage_setup")
  let savedId:string
  try{
    const id=asText(form,"id")
    if(id&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error("Invalid article identifier.")
    const db=supabaseService()
    const {data:existing,error:lookupError}=id
      ?await db.from("academy_guide_posts").select("slug").eq("id",id).maybeSingle()
      :{data:null,error:null}
    if(lookupError||(id&&!existing))throw new Error("The selected article was not found.")
    const input=Object.fromEntries(["title_en","title_es","summary_en","summary_es","body_en","body_es"].map(k=>[k,asText(form,k)]))
    const validation=draftValidation(input,existing?.slug||"")
    if(validation.error||!validation.value)throw new Error(validation.error||"Invalid draft.")
    const category=asText(form,"category")
    const {data:categoryInfo,error:categoryError}=await db.from("academy_guide_categories").select("slug").eq("slug",category).maybeSingle()
    if(categoryError||!categoryInfo)throw new Error("Please select an existing category.")
    const slug=validation.value.slug
    if(Object.values(sections).some(items=>items.some(item=>item.slug===slug)))throw new Error("This URL is reserved for an existing guide.")
    const image=asText(form,"image_path")
    if(!isApprovedArticleImage(image))throw new Error("Please select a valid Academy Cloudinary image.")
    const source=asText(form,"source_url")
    if(source){
      let url:URL
      try{url=new URL(source)}catch{throw new Error("Please enter a valid source URL.")}
      if(url.protocol!=="https:")throw new Error("Source URLs must use HTTPS.")
    }
    const payload={...validation.value,category,slug,image_path:image||null,source_url:source||null,status:"draft"}
    const {data,error}=id
      ?await db.from("academy_guide_posts").update(payload).eq("id",id).select("id").single()
      :await db.from("academy_guide_posts").insert(payload).select("id").single()
    if(error){
      if(error.code==="23505")throw new Error("An article with that URL already exists. Choose a different English title.")
      throw new Error("We couldn't save your draft. Please try again.")
    }
    savedId=data.id
    revalidatePath("/admin/content")
    revalidatePath("/guide")
    revalidatePath("/es/guia")
    revalidatePath("/guide/posts/"+slug)
    revalidatePath("/es/guia/posts/"+slug)
    revalidatePath("/sitemap.xml")
  }catch(error){return {error:errorMessage(error)}}
  redirect("/admin/content?edit="+savedId+"&saved=1")
}

export async function publishGuidePost(_state:Feedback,form:FormData):Promise<Feedback>{
  await assertCapability("manage_setup")
  let id:string
  try{
    id=asText(form,"id")
    const status=asText(form,"status")
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||!["draft","published"].includes(status))
      throw new Error("Invalid publication request.")
    const db=supabaseService()
    const {data:post,error:lookupError}=await db.from("academy_guide_posts").select("slug,category,title_en,title_es,summary_en,summary_es,body_en,body_es").eq("id",id).maybeSingle()
    if(lookupError||!post)throw new Error("Article not found.")
    if(status==="published"){
      const {data:category,error:categoryError}=await db.from("academy_guide_categories").select("kind").eq("slug",post.category).maybeSingle()
      if(categoryError||!category||category.kind!=="public")throw new Error("Test articles cannot be published.")
      const validation=publicationValidation(post)
      if(validation.error)throw new Error(validation.error)
    }
    const {error}=await db.from("academy_guide_posts").update({status}).eq("id",id)
    if(error)throw new Error("Unable to update publication status.")
    for(const path of ["/admin/content","/guide","/es/guia","/guide/posts/"+post.slug,"/es/guia/posts/"+post.slug,"/sitemap.xml"])revalidatePath(path)
  }catch(error){return {error:errorMessage(error)}}
  redirect("/admin/content?edit="+id+"&saved=1")
}
