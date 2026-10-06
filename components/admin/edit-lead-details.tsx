"use client"

import { useState } from "react"

import { updatePreconversionLeadDetails } from "@/actions/lead-details"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type EditableLead = {
  parent_lead_id: string
  child_lead_id: string
  timetable_preference_id: string
  parent_name: string
  email: string
  phone: string | null
  area: string | null
  source: string
  child_first_name: string | null
  child_age: number
  school_name: string | null
  school_year: string | null
  curriculum: string | null
  support_needs: string[] | null
  notes: string | null
  course_or_exam_board: string | null
  preferred_days: string[] | null
  preferred_times: string[] | null
  preferred_frequency: string | null
}

export function EditLeadDetails({ lead }: { lead: EditableLead }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} type="button" variant="outline">
        Edit lead details
      </Button>
    )
  }

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Edit lead details</p>
          <p className="text-xs text-muted-foreground">
            Corrections here do not change the child&apos;s pipeline stage, planned places,
            payment state or communication history.
          </p>
        </div>
        <Button onClick={() => setOpen(false)} size="sm" type="button" variant="ghost">
          Close
        </Button>
      </div>

      <SaveActionForm
        action={updatePreconversionLeadDetails}
        submitLabel="Save lead details"
        successMessage="Lead details updated"
      >
        <input name="parentLeadId" type="hidden" value={lead.parent_lead_id} />
        <input name="childLeadId" type="hidden" value={lead.child_lead_id} />
        <input
          name="timetablePreferenceId"
          type="hidden"
          value={lead.timetable_preference_id}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <Label>Parent name</Label>
            <Input defaultValue={lead.parent_name} name="parentName" required />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Email</Label>
            <Input defaultValue={lead.email} name="email" required type="email" />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Phone</Label>
            <Input defaultValue={lead.phone || ""} name="phone" />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Area</Label>
            <Input defaultValue={lead.area || ""} name="area" />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Source</Label>
            <Input defaultValue={lead.source || ""} name="source" required />
          </label>
        </div>

        <div className="my-5 border-t" />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <Label>Child first name</Label>
            <Input defaultValue={lead.child_first_name || ""} name="childFirstName" required />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Age</Label>
            <Input defaultValue={lead.child_age} min="3" max="21" name="childAge" required type="number" />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>School</Label>
            <Input defaultValue={lead.school_name || ""} name="schoolName" />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>School year</Label>
            <Input defaultValue={lead.school_year || ""} name="schoolYear" />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Curriculum</Label>
            <Input defaultValue={lead.curriculum || ""} name="curriculum" />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Course / exam board</Label>
            <Input defaultValue={lead.course_or_exam_board || ""} name="courseOrExamBoard" />
          </label>
          <label className="space-y-1.5 text-sm sm:col-span-2">
            <Label>Support needs</Label>
            <Input
              defaultValue={lead.support_needs?.join(", ") || ""}
              name="supportNeeds"
              placeholder="Comma-separated"
            />
          </label>
          <label className="space-y-1.5 text-sm sm:col-span-2">
            <Label>Notes</Label>
            <Textarea defaultValue={lead.notes || ""} name="notes" />
          </label>
        </div>

        <div className="my-5 border-t" />

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm">
            <Label>Preferred days</Label>
            <Input
              defaultValue={lead.preferred_days?.join(", ") || ""}
              name="preferredDays"
              placeholder="monday, tuesday"
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Preferred times</Label>
            <Input
              defaultValue={lead.preferred_times?.join(", ") || ""}
              name="preferredTimes"
              placeholder="17:00, 18:00"
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Preferred frequency</Label>
            <Input
              defaultValue={lead.preferred_frequency || ""}
              name="preferredFrequency"
              placeholder="one_day"
            />
          </label>
        </div>
      </SaveActionForm>
    </div>
  )
}
