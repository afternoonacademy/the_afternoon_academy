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
  const [paymentOpen, setPaymentOpen] = useState<string | null>(null)

  const toggleDetails = (lead: FollowUpLead) => {
    const next = expanded === lead.child_lead_id ? null : lead.child_lead_id
    setExpanded(next)
    if (!next) setPaymentOpen(null)
  }

  const canTakePayment = (status: string) =>
    !["converted", "closed"].includes(status)

  const columns: ColumnDef<FollowUpLead>[] = [
    {
      header: "Contact",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-semibold">{row.original.parent_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.email}
          </p>
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
          </p>
        </div>
      ),
    },
    {
      header: "Support",
      cell: ({ row }) => (
        <p className="max-w-[280px] capitalize">
          {row.original.support_needs?.map(label).join(", ") || "To confirm"}
        </p>
      ),
    },
    {
      id: "details",
      header: () => <span className="sr-only">Details</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            onClick={() => toggleDetails(row.original)}
            size="sm"
            type="button"
            variant={
              expanded === row.original.child_lead_id ? "secondary" : "ghost"
            }
          >
            {expanded === row.original.child_lead_id ? "Close" : "Details"}
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const detailsPanel = (lead: FollowUpLead) => {
    const showPayment = paymentOpen === lead.child_lead_id

    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="font-semibold">Availability</p>
            <p className="mt-1 capitalize text-muted-foreground">
              {lead.preferred_days?.join(", ") || "Flexible"}
            </p>
            <p className="text-muted-foreground">
              {lead.preferred_times?.join(", ") || "Time to confirm"}
            </p>
          </div>

          <div>
            <p className="font-semibold">Sessions requested</p>
            <p className="mt-1 text-muted-foreground">
              {frequencyLabel(lead.preferred_frequency)}
            </p>
          </div>

          <div>
            <p className="font-semibold">School / curriculum</p>
            <p className="mt-1 text-muted-foreground">
              {lead.school_name || "Not recorded"}
              {lead.school_year ? " · " + lead.school_year : ""}
            </p>
            <p className="capitalize text-muted-foreground">
              {label(lead.curriculum)}
            </p>
          </div>

          <div>
            <p className="font-semibold">Family contact</p>
            <p className="mt-1 text-muted-foreground">{lead.email}</p>
            <p className="text-muted-foreground">
              {lead.phone || "No phone"}
              {lead.area ? " · " + lead.area : ""}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-semibold">Support context</p>
            <p className="mt-1 capitalize text-muted-foreground">
              {lead.support_needs?.map(label).join(", ") || "Not recorded"}
              {lead.course_or_exam_board
                ? " · Course: " + lead.course_or_exam_board
                : ""}
            </p>
          </div>

          <div>
            <p className="font-semibold">Notes</p>
            <p className="mt-1 text-muted-foreground">
              {lead.notes || "No notes"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t pt-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-semibold">Follow-up status</p>
            <div className="mt-2">
              <LeadActions
                leadId={lead.parent_lead_id}
                parentName={lead.parent_name}
                status={
                  lead.status as Parameters<typeof LeadActions>[0]["status"]
                }
              />
            </div>
          </div>

          {canTakePayment(lead.status) ? (
            <Button
              onClick={() =>
                setPaymentOpen((current) =>
                  current === lead.child_lead_id ? null : lead.child_lead_id,
                )
              }
              type="button"
              variant={showPayment ? "secondary" : "default"}
            >
              {showPayment ? "Close payment & dates" : "Add payment & dates"}
            </Button>
          ) : null}
        </div>

        {showPayment ? (
          <div className="border-t pt-5">
            <div className="mb-4">
              <p className="font-semibold">
                Record payment for {lead.child_first_name || "this child"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This activates only this child’s exact paid dates. Siblings
                remain independent until their own place and payment are
                confirmed.
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
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.id === "details"
                        ? "w-[110px]"
                        : header.id === "child"
                          ? "w-[170px]"
                          : header.id === "support"
                            ? "w-[32%]"
                            : ""
                    }
                  >
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
              const isOpen = expanded === lead.child_lead_id

              return (
                <Fragment key={row.id}>
                  <TableRow className="hover:bg-muted/40">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="align-top">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>

                  {isOpen ? (
                    <TableRow>
                      <TableCell
                        className="bg-muted/20 p-5 text-sm"
                        colSpan={columns.length}
                      >
                        {detailsPanel(lead)}
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
          const isOpen = expanded === lead.child_lead_id
          return (
            <div className="py-4" key={lead.child_lead_id}>
              <button
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => toggleDetails(lead)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {lead.child_first_name || "Child"} · age {lead.child_age}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {lead.email}
                  </span>
                  <span className="mt-1 block capitalize">
                    {lead.support_needs?.map(label).join(", ") || "To confirm"}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {isOpen ? "Close" : "Details"}
                </span>
              </button>

              {isOpen ? (
                <div className="mt-4 border-t pt-4">
                  {detailsPanel(lead)}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}
