"use client"
import {useActionState} from "react"
import {removeUnusedImage} from "@/actions/content-media-cleanup"

export function ContentOrphanDeleteForm({publicId}:{publicId:string}){
  const [state,action,pending]=useActionState(removeUnusedImage,{error:null as string|null,success:null as string|null})
  return <form action={action} className="space-y-2">
    <input type="hidden" name="public_id" value={publicId}/>
    <button type="submit" disabled={pending} className="rounded-xl border border-red-600 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      onClick={e=>{if(!window.confirm("Permanently delete this unused Cloudinary file? This cannot be undone."))e.preventDefault()}}>
      {pending?"Deleting…":"Delete unused image"}
    </button>
    {state.error&&<p role="alert" className="text-xs text-red-700">{state.error}</p>}
    {state.success&&<p role="status" className="text-xs text-green-700">{state.success} Refresh to update the list.</p>}
  </form>
}
