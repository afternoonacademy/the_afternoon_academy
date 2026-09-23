"use client"

import { useState, useTransition } from "react"
import { acceptPlaceOffer } from "@/actions/place-offers"
import { Button } from "@/components/ui/button"

export function AcceptOfferButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState("")
  return <div className="space-y-3"><Button disabled={pending} onClick={() => startTransition(async () => {
    setMessage("")
    try {
      const data = new FormData()
      data.set("token", token)
      await acceptPlaceOffer(data)
      setMessage("Thank you. Your place is held while we wait for your bank transfer. We will email your secure sign-in link once payment is confirmed.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not accept this offer")
    }
  })}>{pending ? "Accepting…" : "Accept this place"}</Button>{message ? <p className="rounded-md border p-3 text-sm" role="status">{message}</p> : null}</div>
}
