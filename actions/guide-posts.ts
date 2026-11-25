"use server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { assertCapability } from "@/lib/auth/require-capability"
import { supabaseService } from "@/lib/supabase/service"
import { sections } from "@/lib/discovery/content"
import { isApprovedArticleImage } from "@/lib/media/taa-cloudinary.mjs"
import { slugFromTitle } from "@/lib/content/seo-slug.mjs"
const fields=["slug","category","title_en","title_es","summary_en","summary_es","body_en","body_es","image_path","source_url"] as const
export async function saveGuidePost(data:FormData){
  await assertCapability("manage_setup")
  const values=Object.fromEntries(fields.map(key=>[key,String(data.get(key)||"").trim()])) as Record<typeof fields[number],string>
  // Derive new-article URLs from the English title on the server as well as in the UI.
  // Existing saved slugs are immutable even if titles change.
  const id=String(data.get("id")||"")
  if(!id) values.slug=slugFromTitle(values.title_en)
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)||values.slug.length>100)throw new Error("Provide an English title with characters usable in a URL")
  if(!["resources","supports","neighbourhoods"].includes(values.category))throw new Error("Invalid category")
  if(Object.values(sections).some(items=>items.some(item=>item.slug===values.slug)))throw new Error("Slug already used by existing guide")
  for(const key of ["title_en","title_es"] as const)if(values[key].length<4||values[key].length>180)throw new Error("Both titles required (4-180 characters)")
  for(const key of ["summary_en","summary_es"] as const)if(values[key].length<20||values[key].length>500)throw new Error("Both summaries required (20-500 characters)")
  for(const key of ["body_en","body_es"] as const)if(values[key].length<60||values[key].length>30000)throw new Error("Both article bodies required (60-30000 characters)")
  if(!isApprovedArticleImage(values.image_path))throw new Error("Select an uploaded Cloudinary image.")
  if(values.source_url){let url:URL;try{url=new URL(values.source_url)}catch{throw new Error("Invalid source URL")}if(url.protocol!=="https:")throw new Error("Source must use HTTPS")}
  if(id&&!/^[a-f0-9-]{36}$/i.test(id))throw new Error("Invalid post id")
  const client=supabaseService()
  if(id){
    const {data:existing,error:existingError}=await client.from("academy_guide_posts").select("slug,status").eq("id",id).maybeSingle()
    if(existingError||!existing)throw new Error("Article not found")
    if(existing.slug!==values.slug)throw new Error("Existing article URLs cannot be changed in the editor.")
  }
  const payload={...values,image_path:values.image_path||null,source_url:values.source_url||null,status:"draft"}
  const result=id?await client.from("academy_guide_posts").update(payload).eq("id",id).select("id").single():
    await client.from("academy_guide_posts").insert({...payload,status:"draft"}).select("id").single()
  if(result.error)throw new Error("Could not save editorial content. Database migration may be pending.")
  revalidatePath("/admin/content");revalidatePath("/guide");revalidatePath("/es/guia")
  revalidatePath("/guide/posts/"+values.slug)
  revalidatePath("/es/guia/posts/"+values.slug)
  revalidatePath("/sitemap.xml")
  redirect("/admin/content?edit="+result.data.id+"&saved=1")
}
export async function publishGuidePost(data:FormData){
  await assertCapability("manage_setup")
  const id=String(data.get("id")||"");const status=String(data.get("status")||"")
  if(!/^[a-f0-9-]{36}$/i.test(id)||!["draft","published"].includes(status))throw new Error("Invalid publication request")
  const {data:post,error:lookup}=await supabaseService().from("academy_guide_posts").select("slug").eq("id",id).maybeSingle()
  if(lookup||!post)throw new Error("Article not found")
  const {error}=await supabaseService().from("academy_guide_posts").update({status}).eq("id",id)
  if(error)throw new Error("Could not update publication status")
  for(const path of ["/guide","/es/guia","/guide/posts/"+post.slug,"/es/guia/posts/"+post.slug,"/sitemap.xml"])revalidatePath(path)
  redirect("/admin/content?edit="+id+"&saved=1")
}
