"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { confirmStaffSignIn } from "@/actions/staff-auth"
import { Button } from "@/components/ui/button"

export function StaffLinkConfirmation() {
  const [link, setLink] = useState<{ token: string; type: string } | null>(null)
  const [message, action, pending] = useActionState(confirmStaffSignIn, "")
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const fragment = new URLSearchParams(window.location.hash.slice(1))
    const token = fragment.get("token_hash") || ""
    const type = fragment.get("type") || ""
    window.history.replaceState(null, "", "/auth/confirm")
    // The token stays in component memory until the explicit confirmation POST.
    setLink({ token, type })
  }, [])
  useEffect(() => {
    if (message === "signed-in") window.location.replace("/admin")
  }, [message])
  return <section className="brand-card w-full max-w-md space-y-5 p-6">
    <h1 className="text-2xl font-bold">Confirm staff sign-in</h1>
    <p>Select Continue to use your secure link on this device.</p>
    {link?.token && message !== "signed-in" ? <form action={action}>
      <input type="hidden" name="token_hash" value={link.token} />
      <input type="hidden" name="type" value={link.type} />
      <Button disabled={pending}>{pending ? "Confirming…" : "Continue"}</Button>
    </form> : <p>{link ? "Reopen your email link or request a new one." : "Loading secure link…"}</p>}
    {message && <p role="status">{message === "signed-in" ? "Opening your staff account…" : message}</p>}
    <Link className="block text-sm underline" href="/staff/sign-up">Request a new staff sign-in link</Link>
  </section>
}
