"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { acceptSessionOffer, sendSessionOffer } from "@/actions/learners"
import { Button } from "@/components/ui/button"

type PlacementActionsProps = {
  placementId: string
  status: "proposed" | "offered" | "confirmed" | "waitlisted" | "ended"
  hasParentLead: boolean
}

export function PlacementActions({ placementId, status, hasParentLead }: PlacementActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState("")

  function run(action: typeof sendSessionOffer | typeof acceptSessionOffer) {
    const formData = new FormData()
    formData.set("placementId", placementId)
    setMessage("")
    startTransition(async () => {
      try {
        await action(formData)
        setMessage("Updated")
        router.refresh()
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not update placement")
      }
    })
  }

  if (status === "confirmed") {
    return <span className="text-xs font-medium text-emerald-700">Confirmed place</span>
  }

  if (status === "waitlisted" || status === "ended") {
    return <span className="text-xs text-muted-foreground">No action needed</span>
  }

  if (status === "proposed") {
    return <div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" disabled={isPending || !hasParentLead} onClick={() => run(sendSessionOffer)}>{isPending ? "Sending…" : "Send session offer"}</Button><span className="text-xs text-muted-foreground">{hasParentLead ? "Next: send the agreed session details to the parent." : "Link this learner to a parent enquiry before sending an offer."}</span><span aria-live="polite" className="text-xs text-destructive">{message}</span></div>
  }

  return <div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" disabled={isPending} onClick={() => run(acceptSessionOffer)}>{isPending ? "Confirming…" : "Parent accepted — confirm place"}</Button><span className="text-xs text-muted-foreground">Next: record acceptance only after the parent has agreed to this session.</span><span aria-live="polite" className="text-xs text-destructive">{message}</span></div>
}
