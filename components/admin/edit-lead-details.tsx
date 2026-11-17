"use client"

import { useState } from "react"

import { updatePreconversionLeadDetails } from "@/actions/lead-details"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LeadChildFields, type LeadChildDraft } from "@/components/forms/lead-child-fields"
import { leadSources } from "@/lib/leads/enquiry-options.mjs"

type EditableLead = {
  parent_lead_id: string
  child_lead_id: string
  timetable_preference_id: string
  parent_name: string
  email: string | null
  phone: string | null
  area: string | null
  source: string
  child_first_name: string | null
  child_age: number | null
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

export function EditLeadDetails({
  lead,
  defaultOpen = false,
}: {
  lead: EditableLead
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [child, setChild] = useState<LeadChildDraft>({
    key: 1, firstName: lead.child_first_name || "", age: lead.child_age == null ? "" : String(lead.child_age),
    schoolName: lead.school_name || "", schoolYear: lead.school_year || "", curriculum: lead.curriculum || "",
    supportNeeds: lead.support_needs || [], courseOrExamBoard: lead.course_or_exam_board || "", notes: lead.notes || "",
    preferredDays: lead.preferred_days || [], preferredTimes: (lead.preferred_times || []).map((time) => time === "17:00" ? "17:00-17:50" : time === "18:00" ? "18:00-18:50" : time),
    preferredFrequency: lead.preferred_frequency || "",
  })

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
            All fields are optional. Corrections do not change the child&apos;s pipeline stage, planned places,
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
            <Input defaultValue={lead.parent_name} name="parentName" />
          </label>
          <label className="space-y-1.5 text-sm">
            <Label>Email</Label>
            <Input defaultValue={lead.email || ""} name="email" type="email" />
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
            <select className="h-10 w-full rounded-md border bg-background px-3" defaultValue={lead.source || ""} name="source">
              <option value="">Not recorded yet</option>
              {lead.source && !leadSources.includes(lead.source) && <option value={lead.source}>{lead.source}</option>}
              {leadSources.map((source) => <option key={source} value={source}>{source === "whatsapp" ? "WhatsApp" : source.replace("_", " ")}</option>)}
            </select>
          </label>
        </div>

        <input type="hidden" name="childDetails" value={JSON.stringify(child)} />
        <LeadChildFields optional child={child} index={0} language="en" canRemove={false} onChange={setChild} onRemove={() => {}} />
      </SaveActionForm>
    </div>
  )
}
