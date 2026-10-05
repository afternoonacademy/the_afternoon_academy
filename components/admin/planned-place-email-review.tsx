"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"

import {
  previewPlannedPlaceEmail,
  sendPlannedPlaceEmail,
} from "@/actions/child-place-planning"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
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
        setSubject(nextDraft.subject)
        setBody(nextDraft.body)
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
          <div className="mb-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              To
            </p>
            <p className="mt-1 font-medium">{draft.to}</p>
          </div>

          <SaveActionForm
            action={sendPlannedPlaceEmail}
            submitLabel="Send email to parent"
            successMessage="Parent contacted — awaiting payment"
          >
            <input name="parentLeadId" type="hidden" value={parentLeadId} />
            <input name="childLeadId" type="hidden" value={childLeadId} />

            <div className="space-y-2">
              <Label htmlFor={"planned-email-subject-" + childLeadId}>
                Subject
              </Label>
              <Input
                id={"planned-email-subject-" + childLeadId}
                maxLength={200}
                name="subject"
                onChange={(event) => setSubject(event.target.value)}
                required
                value={subject}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={"planned-email-body-" + childLeadId}>
                Email
              </Label>
              <textarea
                className="min-h-80 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6"
                id={"planned-email-body-" + childLeadId}
                maxLength={12000}
                name="body"
                onChange={(event) => setBody(event.target.value)}
                required
                value={body}
              />
              <p className="text-xs text-muted-foreground">
                Changes here apply only to this parent email. They do not change
                the reusable Parent communication template.
              </p>
            </div>

            <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
              The subject and body shown above are the exact content that will
              be sent when you confirm.
            </p>
          </SaveActionForm>
        </div>
      ) : null}
    </div>
  )
}
