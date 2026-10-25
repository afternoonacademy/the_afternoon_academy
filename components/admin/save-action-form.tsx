"use client"

import { type ReactNode, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function SaveActionForm({
  action,
  successMessage = "Saved",
  submitLabel = "Save",
  children,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<unknown>
  successMessage?: string
  submitLabel?: string
  children: ReactNode
  onSuccess?: () => void
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData)
        toast.success(successMessage)
        onSuccess?.()
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not save changes",
        )
      }
    })
  }

  return (
    <form action={submit} className="space-y-4">
      {children}
      <Button disabled={pending} type="submit">
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
