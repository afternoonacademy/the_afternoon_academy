import {supabaseService} from "@/lib/supabase/service"
import {eligibleOrphans,isManagedContentId} from "@/lib/media/content-orphan-policy.mjs"

export type ContentCloudinaryAsset={
  public_id:string;secure_url:string;created_at:string;bytes:number;resource_type:string;type:string
}

function authHeader(){
  const cloud=process.env.CLOUDINARY_CLOUD_NAME
  const key=process.env.CLOUDINARY_API_KEY
  const secret=process.env.CLOUDINARY_API_SECRET
  if(cloud!=="s6cu3nwk"||!key||!secret)throw new Error("Cloudinary is not configured for this environment.")
  return "Basic "+Buffer.from(key+":"+secret).toString("base64")
}
async function cloudinaryRequest(path:string,method:"GET"|"DELETE"="GET"){
  const response=await fetch("https://api.cloudinary.com/v1_1/s6cu3nwk"+path,{
    method,headers:{"Authorization":authHeader(),"Accept":"application/json"},cache:"no-store",
    signal:AbortSignal.timeout(15000)
  })
  if(!response.ok)throw new Error("Cloudinary media service is unavailable. Nothing was deleted.")
  return response.json()
}
async function listManagedAssets():Promise<ContentCloudinaryAsset[]>{
  const all:ContentCloudinaryAsset[]=[]
  let cursor:string|undefined
  for(let page=0;page<10;page++){
    const params=new URLSearchParams({prefix:"taa/content/",max_results:"100"})
    if(cursor)params.set("next_cursor",cursor)
    const result=await cloudinaryRequest("/resources/image/upload?"+params)
    if(!Array.isArray(result.resources))throw new Error("Cloudinary inventory incomplete; cleanup disabled.")
    all.push(...result.resources)
    cursor=typeof result.next_cursor==="string"?result.next_cursor:undefined
    if(!cursor)return all
  }
  throw new Error("Cloudinary inventory exceeded the safe scan limit. No files can be deleted.")
}
async function referencedArticleImages(){
  // Fail closed on incomplete database data, including pagination.
  const images:string[]=[]
  for(let offset=0;offset<10000;offset+=500){
    const {data,error}=await supabaseService().from("academy_guide_posts")
      .select("image_path").not("image_path","is",null)
      .range(offset,offset+499)
    if(error)throw new Error("Could not verify article image references. Cleanup disabled.")
    images.push(...(data||[]).map((p:{image_path:string|null})=>p.image_path).filter((x):x is string=>!!x))
    if((data||[]).length<500)return images
  }
  throw new Error("Article reference scan too large. Cleanup disabled.")
}
export async function unusedContentImages(){
  const [assets,images]=await Promise.all([listManagedAssets(),referencedArticleImages()])
  return eligibleOrphans(assets,images) as ContentCloudinaryAsset[]
}
export async function deleteUnusedContentImage(publicId:string){
  if(!isManagedContentId(publicId))throw new Error("Invalid content image.")
  // Recompute inventory and all article references at deletion time.
  const candidates=await unusedContentImages()
  if(!candidates.some(item=>item.public_id===publicId))throw new Error("This image is not eligible for deletion.")
  const params=new URLSearchParams()
  params.append("public_ids[]",publicId)
  const result=await cloudinaryRequest("/resources/image/upload?"+params,"DELETE")
  if(result.deleted?.[publicId]!=="deleted")throw new Error("Cloudinary did not confirm deletion.")
}
