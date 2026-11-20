"use client"

import { type ReactNode, useState, useTransition } from "react"
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
  const [feedback, setFeedback] = useState<string | null>(null)

  function submit(formData: FormData) {
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await action(formData)
        if (result && typeof result === "object" && "error" in result &&
            typeof result.error === "string") {
          setFeedback(result.error)
          return
        }
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
      {feedback ? <p role="alert" className="text-sm font-medium text-destructive">{feedback}</p> : null}
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
