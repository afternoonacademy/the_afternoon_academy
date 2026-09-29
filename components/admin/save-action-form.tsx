"use client"

import { type ReactNode, useTransition } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function SaveActionForm({ action, successMessage = "Saved", submitLabel = "Save", children }: { action: (formData: FormData) => Promise<void>; successMessage?: string; submitLabel?: string; children: ReactNode }) {
  const [pending, startTransition] = useTransition()
  function submit(formData: FormData) { startTransition(async () => { try { await action(formData); toast.success(successMessage) } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save changes") } }) }
  return <form action={submit} className="space-y-4">{children}<Button disabled={pending} type="submit">{pending ? <><LoaderCircle className="animate-spin" />Saving…</> : submitLabel}</Button></form>
}
