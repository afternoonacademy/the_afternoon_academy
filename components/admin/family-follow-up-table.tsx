"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Fragment, useState } from "react"

import { LeadActions } from "@/components/admin/lead-actions"
import { ManualEnrolmentForm } from "@/components/admin/manual-enrolment-form"
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

type PricePlan = { id: string; name: string; price_cents: number }

const label = (value: string | null) =>
  value ? value.replaceAll("_", " ") : "—"

const frequencyLabel = (value: string | null) => {
  switch (value) {
    case "one_day":
      return "1 / week"
    case "two_days":
      return "2 / week"
    case "three_days":
      return "3 / week"
    case "four_plus_days":
      return "4+ / week"
    case "not_sure":
      return "Not sure"
    default:
      return "—"
  }
}

export function FamilyFollowUpTable({
  leads,
  slots,
  pricePlans,
  closures,
}: {
  leads: FollowUpLead[]
  slots: Slot[]
  pricePlans: PricePlan[]
  closures: AcademyClosure[]
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (lead: FollowUpLead, mode: "details" | "payment") => {
    const key = lead.child_lead_id + ":" + mode
    setExpanded((current) => (current === key ? null : key))
  }

  const canTakePayment = (status: string) =>
    !["converted", "closed"].includes(status)

  const columns: ColumnDef<FollowUpLead>[] = [
    {
      header: "Family",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.parent_name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      header: "Child",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">
            {row.original.child_first_name || "Child"}
          </p>
          <p className="text-xs text-muted-foreground">
            Age {row.original.child_age}
            {row.original.school_year ? " · " + row.original.school_year : ""}
          </p>
        </div>
      ),
    },
    {
      header: "Support",
      cell: ({ row }) => (
        <div>
          <p className="capitalize">
            {row.original.support_needs?.map(label).join(", ") || "To confirm"}
          </p>
          {row.original.course_or_exam_board ? (
            <p className="text-xs text-muted-foreground">
              {row.original.course_or_exam_board}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      header: "Sessions / week",
      cell: ({ row }) => (
        <span className="font-medium">
          {frequencyLabel(row.original.preferred_frequency)}
        </span>
      ),
    },
    {
      header: "Availability",
      cell: ({ row }) => (
        <div>
          <p className="capitalize">
            {row.original.preferred_days?.join(", ") || "Flexible"}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.preferred_times?.join(", ") || "Time to confirm"}
          </p>
        </div>
      ),
    },
    {
      header: "Follow-up",
      cell: ({ row }) => (
        <LeadActions
          leadId={row.original.parent_lead_id}
          parentName={row.original.parent_name}
          status={
            row.original.status as Parameters<typeof LeadActions>[0]["status"]
          }
        />
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const lead = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => toggle(lead, "details")}
              size="sm"
              type="button"
              variant="ghost"
            >
              {expanded === lead.child_lead_id + ":details"
                ? "Close"
                : "Details"}
            </Button>
            {canTakePayment(lead.status) ? (
              <Button
                onClick={() => toggle(lead, "payment")}
                size="sm"
                type="button"
                variant={
                  expanded === lead.child_lead_id + ":payment"
                    ? "secondary"
                    : "outline"
                }
              >
                {expanded === lead.child_lead_id + ":payment"
                  ? "Close"
                  : "Add payment & dates"}
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const detailPanel = (lead: FollowUpLead) => (
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <p className="font-semibold">School and area</p>
        <p className="mt-1 text-muted-foreground">
          {lead.school_name || "Not recorded"}
          {lead.area ? " · " + lead.area : ""}
        </p>
      </div>
      <div>
        <p className="font-semibold">Support and interest</p>
        <p className="mt-1 capitalize text-muted-foreground">
          {lead.support_needs?.map(label).join(", ") || "Not recorded"} ·{" "}
          {label(lead.interest_level)}
        </p>
      </div>
      <div>
        <p className="font-semibold">Notes</p>
        <p className="mt-1 text-muted-foreground">
          {lead.notes || "No notes"}
          {lead.course_or_exam_board
            ? " · Course: " + lead.course_or_exam_board
            : ""}
        </p>
      </div>
    </div>
  )

  const paymentPanel = (lead: FollowUpLead) => (
    <div className="space-y-3">
      <div>
        <p className="font-semibold">
          Record payment for {lead.child_first_name || "this child"}
        </p>
        <p className="text-sm text-muted-foreground">
          This activates only this child’s exact paid dates. Siblings remain
          independent and can be offered or paid separately.
        </p>
      </div>
      <ManualEnrolmentForm
        childOptions={[
          {
            id: lead.child_lead_id,
            first_name: lead.child_first_name,
            child_age: lead.child_age,
          },
        ]}
        fixedChild={{
          id: lead.child_lead_id,
          first_name: lead.child_first_name,
          child_age: lead.child_age,
        }}
        parentLeadId={lead.parent_lead_id}
        pricePlans={pricePlans}
        slots={slots}
        closures={closures}
      />
    </div>
  )

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const lead = row.original
              const detailOpen = expanded === lead.child_lead_id + ":details"
              const paymentOpen = expanded === lead.child_lead_id + ":payment"
              return (
                <Fragment key={row.id}>
                  <TableRow className="hover:bg-muted/40">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {detailOpen || paymentOpen ? (
                    <TableRow>
                      <TableCell
                        className="bg-muted/20 p-5 text-sm"
                        colSpan={columns.length}
                      >
                        {detailOpen ? detailPanel(lead) : paymentPanel(lead)}
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
        {leads.map((lead) => {
          const detailOpen = expanded === lead.child_lead_id + ":details"
          const paymentOpen = expanded === lead.child_lead_id + ":payment"
          return (
            <div className="py-4" key={lead.child_lead_id}>
              <div>
                <p className="font-semibold">
                  {lead.child_first_name || "Child"} · {lead.parent_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {frequencyLabel(lead.preferred_frequency)} ·{" "}
                  {lead.preferred_days?.join(", ") || "Availability to confirm"}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => toggle(lead, "details")}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {detailOpen ? "Close" : "Details"}
                </Button>
                {canTakePayment(lead.status) ? (
                  <Button
                    onClick={() => toggle(lead, "payment")}
                    size="sm"
                    type="button"
                    variant={paymentOpen ? "secondary" : "outline"}
                  >
                    {paymentOpen ? "Close" : "Add payment & dates"}
                  </Button>
                ) : null}
              </div>

              {detailOpen ? (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {lead.email} · {lead.phone || "No phone"}
                  </p>
                  {detailPanel(lead)}
                  <LeadActions
                    leadId={lead.parent_lead_id}
                    parentName={lead.parent_name}
                    status={
                      lead.status as Parameters<typeof LeadActions>[0]["status"]
                    }
                  />
                </div>
              ) : null}

              {paymentOpen ? (
                <div className="mt-4 border-t pt-4">
                  {paymentPanel(lead)}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}
