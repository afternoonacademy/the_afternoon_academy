import { supabaseService } from "@/lib/supabase/service"
export type GuidePost = { id:string; slug:string; slug_en:string|null; slug_es:string|null; category:string; status:"draft"|"published"; title_en:string;title_es:string;summary_en:string;summary_es:string;body_en:string;body_es:string;image_path:string|null;source_url:string|null }
const select="id,slug,slug_en,slug_es,category,status,title_en,title_es,summary_en,summary_es,body_en,body_es,image_path,source_url"
export async function guidePosts(onlyPublished=false):Promise<GuidePost[]> {
  let query=supabaseService().from("academy_guide_posts").select(select).order("created_at",{ascending:false})
  if(onlyPublished)query=query.eq("status","published").neq("category","test")
  const {data,error}=await query
  if(error){if(onlyPublished)return [];throw new Error("Editorial database not configured for this environment.")}
  return (data||[]) as GuidePost[]
}
export function localizedGuideSlug(post:Pick<GuidePost,"slug"|"slug_en"|"slug_es">,lang:"en"|"es"){
  return lang==="en"?(post.slug_en||post.slug):(post.slug_es||post.slug)
}
export async function publishedGuidePost(slug:string,lang:"en"|"es"="en"):Promise<GuidePost|null>{
  const column=lang==="en"?"slug_en":"slug_es"
  const db=supabaseService()
  const query=()=>db.from("academy_guide_posts").select(select).eq("status","published").neq("category","test")
  const direct=await query().eq(column,slug).maybeSingle()
  if(!direct.error&&direct.data)return direct.data as GuidePost
  // Legacy URLs are still recognised for existing links. The Spanish page redirects
  // visitors to its canonical translated slug at the route boundary.
  const legacy=await query().eq("slug",slug).maybeSingle()
  return legacy.error?null:legacy.data as GuidePost|null
}
/** Read a saved draft for an authenticated admin preview; caller MUST enforce manage_setup. */
export async function guidePostForPreview(id:string):Promise<GuidePost|null>{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return null
  const {data,error}=await supabaseService().from("academy_guide_posts").select(select).eq("id",id).maybeSingle()
  if(error)throw new Error("Unable to load the saved article preview.")
  return data as GuidePost|null
}

export type GuideCategory = {slug:string;title_en:string;title_es:string;kind:"public"|"test";sort_order:number}
export async function guideCategories():Promise<GuideCategory[]>{
  const {data,error}=await supabaseService().from("academy_guide_categories")
    .select("slug,title_en,title_es,kind,sort_order").order("sort_order",{ascending:true}).order("slug",{ascending:true})
  if(error)throw new Error("Editorial categories unavailable.")
  return (data||[]) as GuideCategory[]
}
