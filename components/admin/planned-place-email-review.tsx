"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronUp, Loader2, Mail } from "lucide-react"

import {
  previewPlannedPlaceEmail,
  sendPlannedPlaceEmail,
} from "@/actions/child-place-planning"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Button } from "@/components/ui/button"

type Draft = {
  to: string
  subject: string
  body: string
}

export function PlannedPlaceEmailReview({
  parentLeadId,
  childLeadId,
}: {
  parentLeadId: string
  childLeadId: string
}) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function reviewEmail() {
    if (open && draft) {
      setOpen(false)
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const nextDraft = await previewPlannedPlaceEmail(
          parentLeadId,
          childLeadId,
        )
        setDraft(nextDraft)
        setOpen(true)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "The planned-place email could not be generated",
        )
      }
    })
  }

  return (
    <div className="space-y-3">
      <Button
        disabled={pending}
        onClick={reviewEmail}
        type="button"
        variant="outline"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : open ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
        {pending ? "Generating email…" : open ? "Hide email" : "Review email"}
      </Button>

      {error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : null}

      {open && draft ? (
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                To
              </p>
              <p className="mt-1 font-medium">{draft.to}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </p>
              <p className="mt-1 font-medium">{draft.subject}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email
              </p>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border bg-background p-4 font-sans text-sm leading-6">
                {draft.body}
              </pre>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Review the email above. Sending will contact the parent and move
              the child to awaiting payment.
            </p>
            <SaveActionForm
              action={sendPlannedPlaceEmail}
              submitLabel="Send email to parent"
              successMessage="Parent contacted — awaiting payment"
            >
              <input name="parentLeadId" type="hidden" value={parentLeadId} />
              <input name="childLeadId" type="hidden" value={childLeadId} />
            </SaveActionForm>
          </div>
        </div>
      ) : null}
    </div>
  )
}
