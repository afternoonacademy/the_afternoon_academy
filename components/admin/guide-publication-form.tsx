"use client"
import {useActionState} from "react"
import {publishGuidePost} from "@/actions/guide-posts"

export function GuidePublicationForm({id,status}:{id:string;status:"draft"|"published"}){
  const [state,action,pending]=useActionState(publishGuidePost,{error:null as string|null})
  return <form action={action} className="space-y-3">
    <input type="hidden" name="id" value={id}/>
    <input type="hidden" name="status" value={status==="published"?"draft":"published"}/>
    {state.error&&<p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900">{state.error}</p>}
    <button disabled={pending} type="submit" className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">
      {pending?"Saving…":status==="published"?"Unpublish article":"Publish both languages"}
    </button>
  </form>
}
