"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { acceptLeadSessionOffer, sendLeadSessionOffer } from "@/actions/learners"
import { Button } from "@/components/ui/button"

export function LeadOfferActions({ offerId, status }: { offerId: string; status: "proposed" | "offered" | "confirmed" | "waitlisted" | "ended" }) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [message, setMessage] = useState("")
  const run = (action: typeof sendLeadSessionOffer | typeof acceptLeadSessionOffer) => { const data = new FormData(); data.set("offerId", offerId); setMessage(""); startTransition(async () => { try { await action(data); router.refresh() } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update") } }) }
  if (status === "confirmed") return <span className="text-xs font-medium text-emerald-700">Enrolled</span>
  if (status === "offered") return <div className="flex flex-wrap items-center gap-2"><Button size="sm" type="button" disabled={pending} onClick={() => run(acceptLeadSessionOffer)}>{pending ? "Confirming…" : "Parent accepted — enrol"}</Button><span className="text-xs text-muted-foreground">Await parent acceptance before using this.</span><span className="text-xs text-destructive">{message}</span></div>
  return <div className="flex flex-wrap items-center gap-2"><Button size="sm" type="button" disabled={pending} onClick={() => run(sendLeadSessionOffer)}>{pending ? "Sending…" : "Send session offer"}</Button><span className="text-xs text-muted-foreground">Next: send the specific details to the parent.</span><span className="text-xs text-destructive">{message}</span></div>
}
