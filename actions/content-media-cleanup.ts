"use server"
import {revalidatePath} from "next/cache"
import {assertCapability} from "@/lib/auth/require-capability"
import {deleteUnusedContentImage} from "@/lib/media/content-cleanup"

type State={error:string|null;success:string|null}
export async function removeUnusedImage(_state:State,formData:FormData):Promise<State>{
  await assertCapability("manage_setup")
  const id=String(formData.get("public_id")||"")
  try{
    await deleteUnusedContentImage(id)
    revalidatePath("/admin/content/media")
    return {error:null,success:"Unused image deleted from Cloudinary."}
  }catch(e){
    return {error:e instanceof Error?e.message:"Deletion failed. No deletion confirmed.",success:null}
  }
}
