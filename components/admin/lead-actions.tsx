"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { deleteLead, updateLeadStatus } from "@/actions/update-lead-status"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const leadStatuses = [
  "new",
  "warm",
  "priority",
  "contacted",
  "offer_sent",
  "waitlist",
  "converted",
  "closed",
] as const

type LeadActionsProps = {
  leadId: string
  parentName: string
  status: (typeof leadStatuses)[number]
}

export function LeadActions({ leadId, parentName, status }: LeadActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedStatus, setSelectedStatus] = useState(status)
  const [message, setMessage] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function labelFor(statusValue: (typeof leadStatuses)[number]) {
    if (statusValue === "offer_sent") return "Offer sent — awaiting reply"
    if (statusValue === "converted") return "Enrolled (accepted)"
    return statusValue.replaceAll("_", " ")
  }

  function updateStatus(nextStatus: string) {
    setMessage("")
    setSelectedStatus(nextStatus as (typeof leadStatuses)[number])
    const formData = new FormData()
    formData.set("leadId", leadId)
    formData.set("status", nextStatus)

    startTransition(async () => {
      try {
        await updateLeadStatus(formData)
        setMessage("Updated")
        router.refresh()
      } catch {
        setSelectedStatus(status)
        setMessage("Could not update")
      }
    })
  }

  function confirmDeletion() {
    const formData = new FormData()
    formData.set("leadId", leadId)
    formData.set("confirmation", confirmation)

    startTransition(async () => {
      try {
        await deleteLead(formData)
        setIsDialogOpen(false)
        router.refresh()
      } catch {
        setMessage("Could not delete")
      }
    })
  }

  return (
    <div className="flex min-w-[230px] items-center gap-2">
      <select
        value={selectedStatus}
        onChange={(event) => updateStatus(event.target.value)}
        disabled={isPending}
        className="h-8 min-w-0 rounded-md border bg-background px-2 text-sm capitalize disabled:opacity-60"
        aria-label={`Update follow-up status for ${parentName}`}
      >
        {leadStatuses.map((leadStatus) => (
          <option key={leadStatus} value={leadStatus} disabled={leadStatus === "converted" && status !== "converted"}>
            {labelFor(leadStatus)}
          </option>
        ))}
      </select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="destructive" disabled={isPending}>
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this enquiry?</DialogTitle>
            <DialogDescription>
              This permanently removes {parentName}&apos;s enquiry and its linked child and timetable details. Type DELETE to continue.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Type DELETE"
            aria-label={`Confirm deletion of ${parentName}'s enquiry`}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmation !== "DELETE" || isPending}
              onClick={confirmDeletion}
            >
              {isPending ? "Deleting…" : "Permanently delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <span aria-live="polite" className="text-xs text-muted-foreground">
        {isPending ? "Saving…" : message}
      </span>
    </div>
  )
}
