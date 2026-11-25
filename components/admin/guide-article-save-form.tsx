"use client"
import {useActionState} from "react"
import {saveGuidePost} from "@/actions/guide-posts"
import type {ReactNode} from "react"

export function GuideArticleSaveForm({children}:{children:ReactNode}){
  const [state,action,pending]=useActionState(saveGuidePost,{error:null as string|null})
  return <form action={action} className="brand-card space-y-4 p-5">
    {state.error&&<div role="alert" aria-live="assertive" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
      <strong>Draft not saved.</strong> {state.error}
    </div>}
    {children}
    <button type="submit" disabled={pending}
      className="rounded-xl bg-[#26345f] px-5 py-3 font-semibold text-white disabled:opacity-50">
      {pending?"Saving draft…":"Save draft"}
    </button>
  </form>
}
