import { supabaseService } from "@/lib/supabase/service"
export type GuidePost = { id:string; slug:string; category:"resources"|"supports"|"neighbourhoods"; status:"draft"|"published"; title_en:string;title_es:string;summary_en:string;summary_es:string;body_en:string;body_es:string;image_path:string|null;source_url:string|null }
const select="id,slug,category,status,title_en,title_es,summary_en,summary_es,body_en,body_es,image_path,source_url"
export async function guidePosts(onlyPublished=false):Promise<GuidePost[]> {
  let query=supabaseService().from("academy_guide_posts").select(select).order("created_at",{ascending:false})
  if(onlyPublished)query=query.eq("status","published")
  const {data,error}=await query
  if(error){if(onlyPublished)return [];throw new Error("Editorial database not configured for this environment.")}
  return (data||[]) as GuidePost[]
}
export async function publishedGuidePost(slug:string):Promise<GuidePost|null>{
  const {data,error}=await supabaseService().from("academy_guide_posts").select(select).eq("slug",slug).eq("status","published").maybeSingle()
  return error?null:data as GuidePost|null
}
