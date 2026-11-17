"use client"

import { useActionState } from "react"
import Link from "next/link"
import { requestStaffSignIn } from "@/actions/staff-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function StaffSignupForm() {
  const [message, action, pending] = useActionState(requestStaffSignIn, "")
  return <section className="brand-card w-full max-w-md p-6 space-y-5">
    <h1 className="text-2xl font-bold">Staff signup & sign-in</h1>
    <p>An Academy Admin must approve your email first. Use that email to receive a secure sign-in link. No password is needed.</p>
    <form action={action} className="space-y-4">
      <label className="grid gap-2">Work email<Input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <Button disabled={pending}>{pending ? "Requesting link…" : "Email me a staff sign-in link"}</Button>
    </form>
    {message && <p role="status" className="text-sm">{message}</p>}
    <Link href="/sign-in" className="text-sm underline">Back to sign in</Link>
  </section>
}
