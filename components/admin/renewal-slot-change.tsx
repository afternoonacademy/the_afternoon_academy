"use client"

import { useState } from "react"

import { moveRenewalRecurringSlot } from "@/actions/renewal-slot"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { addUtcDays, type PaidPeriodPlacement, type PaidPeriodSession } from "@/lib/paid-period"

export type RenewalSlotOption = {
  id: string
  weekday: number
  table_number: number
  starts_at: string
  effective_from: string
  effective_to: string | null
}

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function RenewalSlotChange({
  caseId, parentLeadId, offerRevision, paidThrough, placement, sessions, templates, onSaved,
}: {
  caseId: string
  parentLeadId: string
  offerRevision: number
  paidThrough: string
  placement: PaidPeriodPlacement
  sessions: PaidPeriodSession[]
  templates: RenewalSlotOption[]
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date())
  const earliest = [today, addUtcDays(paidThrough, 1), placement.effectiveFrom ? addUtcDays(placement.effectiveFrom, 1) : today].sort().at(-1)!
  const movableDates = sessions
    .filter((session) => session.placementId === placement.placementId && !session.replacement && session.date >= earliest)
    .map((session) => session.date)
    .sort()
  const options = templates.filter((template) =>
    template.weekday >= 1 && template.weekday <= 5 &&
    template.weekday !== placement.weekday && !template.effective_to,
  )
  if (placement.effectiveTo || !options.length || !movableDates.length) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">Change recurring slot</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change the {weekdays[placement.weekday]} slot</DialogTitle>
          <DialogDescription>
            Move the selected weekly place and its upcoming renewal dates together. The offer is saved for review.
          </DialogDescription>
        </DialogHeader>
        <SaveActionForm
          action={moveRenewalRecurringSlot}
          submitLabel="Save slot and update offer"
          successMessage="Recurring slot and renewal offer updated"
          onSuccess={() => { setOpen(false); onSaved() }}
        >
          <input name="caseId" type="hidden" value={caseId} />
          <input name="parentLeadId" type="hidden" value={parentLeadId} />
          <input name="placementId" type="hidden" value={placement.placementId} />
          <input name="offerRevision" type="hidden" value={offerRevision} />
          <label className="grid gap-1.5 text-sm font-medium">
            New weekly slot
            <select className="h-10 rounded-md border bg-background px-2" name="templateId" required defaultValue="">
              <option value="" disabled>Choose a weekday, time and table</option>
              {options.map((template) => (
                <option key={template.id} value={template.id}>
                  {weekdays[template.weekday]} · {template.starts_at.slice(0, 5)} · Table {template.table_number}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Move {weekdays[placement.weekday]} dates on or after
            <Input name="effectiveDate" type="date" min={earliest} max={movableDates.at(-1)} defaultValue={movableDates[0]} required />
          </label>
          <p className="text-xs text-muted-foreground">
            Availability is checked on save. Academy closure dates are skipped.
          </p>
        </SaveActionForm>
      </DialogContent>
    </Dialog>
  )
}
