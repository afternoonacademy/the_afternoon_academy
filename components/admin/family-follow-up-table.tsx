"use client"

import { Fragment, useMemo, useState } from "react"

import {
  ChildPlaceWorkflow,
  type PlannedBooking,
  type RecurringSeatHold,
} from "@/components/admin/child-place-workflow"
import { EditLeadDetails } from "@/components/admin/edit-lead-details"
import {
  FamilyCommunications,
  type FamilyCommunication,
} from "@/components/admin/family-communications"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AcademyClosure } from "@/lib/paid-period"

export type FollowUpLead = {
  parent_lead_id: string
  child_lead_id: string
  timetable_preference_id: string
  child_first_name: string | null
  parent_name: string
  email: string
  phone: string | null
  area: string | null
  school_name: string | null
  interest_level: string
  status: string
  source: string
  enquiry_type: string
  child_age: number
  school_year: string | null
  curriculum: string | null
  support_needs: string[] | null
  notes: string | null
  focus_group_code: string | null
  focus_group_preferred_session: string | null
  course_or_exam_board: string | null
  preferred_days: string[] | null
  preferred_times: string[] | null
  preferred_frequency: string | null
  created_at: string
}

type Slot = {
  id: string
  weekday: number
  table_number: number
  academy_table_id: string
  starts_at: string
  duration_minutes: number
  teacher_name: string | null
  focus: string | null
}

type PricePlan = {
  id: string
  name: string
  price_cents: number
}

const label = (value: string | null) =>
  value ? value.replaceAll("_", " ") : "—"

const statusLabel = (value: string) => {
  if (value === "new") return "Lead received"
  if (value === "session_planned") return "Session planned"
  if (value === "contacted") return "Contacted — awaiting payment"
  if (value === "waitlist") return "Waitlist"
  return value.replaceAll("_", " ")
}

export function FamilyFollowUpTable({
  leads,
  slots,
  pricePlans,
  closures,
  seatCapacities,
  seatHolds,
  plannedBookings,
  communications,
}: {
  leads: FollowUpLead[]
  slots: Slot[]
  pricePlans: PricePlan[]
  closures: AcademyClosure[]
  seatCapacities: Record<string, number>
  seatHolds: RecurringSeatHold[]
  plannedBookings: PlannedBooking[]
  communications: FamilyCommunication[]
}) {
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<string | null>(null)

  const families = useMemo(() => {
    const map = new Map<
      string,
      {
        parentLeadId: string
        parentName: string
        email: string
        phone: string | null
        children: FollowUpLead[]
      }
    >()

    for (const lead of leads) {
      const family = map.get(lead.parent_lead_id) || {
        parentLeadId: lead.parent_lead_id,
        parentName: lead.parent_name,
        email: lead.email,
        phone: lead.phone,
        children: [],
      }
      family.children.push(lead)
      map.set(lead.parent_lead_id, family)
    }

    return [...map.values()]
  }, [leads])

  const plannedByChild = new Map<string, PlannedBooking[]>()
  for (const booking of plannedBookings) {
    const current = plannedByChild.get(booking.child_lead_id) || []
    current.push(booking)
    plannedByChild.set(booking.child_lead_id, current)
  }

  const childPanel = (lead: FollowUpLead) => (
    <div className="space-y-5 rounded-xl border bg-background p-4" key={lead.child_lead_id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">
            {lead.child_first_name || "Child"} · age {lead.child_age}
          </p>
          <p className="text-sm text-muted-foreground">
            {lead.school_name || "School not recorded"}
            {lead.school_year ? " · " + lead.school_year : ""}
          </p>
        </div>
        <Badge variant="secondary">{statusLabel(lead.status)}</Badge>
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="font-semibold">Availability</p>
          <p className="text-muted-foreground">
            {lead.preferred_days?.join(", ") || "Flexible"} ·{" "}
            {lead.preferred_times?.join(", ") || "Time to confirm"}
          </p>
        </div>
        <div>
          <p className="font-semibold">Support</p>
          <p className="text-muted-foreground">
            {lead.support_needs?.map(label).join(", ") || "Not recorded"}
          </p>
        </div>
        <div>
          <p className="font-semibold">Notes</p>
          <p className="text-muted-foreground">{lead.notes || "No notes"}</p>
        </div>
      </div>

      <div>
        <Button
          onClick={() =>
            setEditTarget((current) =>
              current === lead.child_lead_id ? null : lead.child_lead_id,
            )
          }
          size="sm"
          type="button"
          variant="outline"
        >
          {editTarget === lead.child_lead_id ? "Close edit" : "Edit"}
        </Button>
      </div>

      {editTarget === lead.child_lead_id ? (
        <EditLeadDetails defaultOpen lead={lead} />
      ) : null}

      <ChildPlaceWorkflow
        child={{
          id: lead.child_lead_id,
          first_name: lead.child_first_name,
          child_age: lead.child_age,
        }}
        closures={closures}
        parentLeadId={lead.parent_lead_id}
        pipelineStatus={lead.status}
        plannedBookings={plannedByChild.get(lead.child_lead_id) || []}
        pricePlans={pricePlans}
        seatCapacities={seatCapacities}
        seatHolds={seatHolds}
        slots={slots}
      />
    </div>
  )

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>Children</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {families.map((family) => {
              const open = expandedFamily === family.parentLeadId
              return (
                <Fragment key={family.parentLeadId}>
                  <TableRow>
                    <TableCell className="align-top">
                      <p className="font-semibold">{family.parentName}</p>
                      <p className="text-xs text-muted-foreground">{family.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {family.phone || "No phone"}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-2">
                        {family.children.map((child) => (
                          <div key={child.child_lead_id}>
                            <p className="font-semibold">
                              {child.child_first_name || "Child"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Age {child.child_age}
                              {child.school_year ? " · " + child.school_year : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-2">
                        {family.children.map((child) => (
                          <div key={child.child_lead_id}>
                            <Badge variant="secondary">
                              {statusLabel(child.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button
                        onClick={() => {
                          setExpandedFamily(open ? null : family.parentLeadId)
                          setEditTarget(null)
                        }}
                        size="sm"
                        type="button"
                        variant={open ? "secondary" : "outline"}
                      >
                        {open ? "Close" : "Manage"}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {open ? (
                    <TableRow>
                      <TableCell className="bg-muted/20 p-5" colSpan={4}>
                        <div className="space-y-4">
                          {family.children.map(childPanel)}
                          <div className="border-t pt-4">
                            <FamilyCommunications
                              communications={communications.filter(
                                (item) =>
                                  item.parent_lead_id === family.parentLeadId,
                              )}
                              emptyLabel="No parent communications have been sent for this family yet."
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y border-y md:hidden">
        {families.map((family) => {
          const open = expandedFamily === family.parentLeadId
          return (
            <div className="py-4" key={family.parentLeadId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{family.parentName}</p>
                  <p className="text-sm text-muted-foreground">{family.email}</p>
                  <div className="mt-2 space-y-1">
                    {family.children.map((child) => (
                      <p className="text-sm" key={child.child_lead_id}>
                        {child.child_first_name || "Child"} · age {child.child_age}
                      </p>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setExpandedFamily(open ? null : family.parentLeadId)
                    setEditTarget(null)
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {open ? "Close" : "Manage"}
                </Button>
              </div>

              {open ? (
                <div className="mt-4 space-y-4">
                  {family.children.map(childPanel)}
                  <FamilyCommunications
                    communications={communications.filter(
                      (item) => item.parent_lead_id === family.parentLeadId,
                    )}
                    emptyLabel="No parent communications have been sent for this family yet."
                  />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}
