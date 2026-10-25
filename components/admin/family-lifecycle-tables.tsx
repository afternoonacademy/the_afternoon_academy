import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type FamilyCustomerRow = {
  parentLeadId: string
  learnerId: string
  learnerName: string
  parentName: string
  email: string
  yearGroup: string | null
  paidThrough: string | null
  placeSummary: string
  inRenewal?: boolean
}

export type FamilyCustomerFamilyRow = {
  parentLeadId: string | null
  parentName: string
  email: string
  activeLearnerCount: number
  children: Array<{
    learnerId: string
    learnerName: string
    yearGroup: string | null
    paidThrough: string | null
    placeSummary: string
    inRenewal?: boolean
  }>
}

export type FamilyArchiveRow = {
  key: string
  learnerId: string | null
  childName: string
  parentName: string
  email: string
  reason: string
  closedAt: string | null
}

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value + (value.length === 10 ? "T12:00:00Z" : "")))
    : "—"

export function FamilyCustomersTable({
  rows,
}: {
  rows: FamilyCustomerFamilyRow[]
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>Learners</TableHead>
              <TableHead>Recurring places</TableHead>
              <TableHead>Paid through</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.parentLeadId || row.children[0]?.learnerId}>
                <TableCell className="align-top">
                  <p className="font-semibold">{row.parentName}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.activeLearnerCount} active learner
                    {row.activeLearnerCount === 1 ? "" : "s"}
                  </p>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-3">
                    {row.children.map((child) => (
                      <div key={child.learnerId}>
                        <p className="font-semibold">{child.learnerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {child.yearGroup || "Year group to confirm"}
                        </p>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-3">
                    {row.children.map((child) => (
                      <p key={child.learnerId}>{child.placeSummary}</p>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-3">
                    {row.children.map((child) => (
                      <div key={child.learnerId}>
                        <Badge
                          className={
                            child.inRenewal
                              ? "border-amber-300 bg-amber-100 text-amber-950"
                              : ""
                          }
                          variant="secondary"
                        >
                          {child.inRenewal ? "Renewal due · " : ""}
                          {formatDate(child.paidThrough)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right align-top">
                  {row.parentLeadId ? (
                    <Link
                      className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-semibold hover:bg-muted"
                      href={"/admin/families/" + row.parentLeadId}
                    >
                      Manage
                    </Link>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y border-y md:hidden">
        {rows.map((row) => {
          const content = (
            <span className="flex w-full items-start justify-between gap-4 py-4">
              <span className="min-w-0">
                <span className="block font-semibold">{row.parentName}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {row.email}
                </span>
                <span className="mt-2 block space-y-2">
                  {row.children.map((child) => (
                    <span className="block" key={child.learnerId}>
                      <span className="block font-semibold">{child.learnerName}</span>
                      <span className="block text-sm">{child.placeSummary}</span>
                    </span>
                  ))}
                </span>
              </span>
              <Badge className="shrink-0" variant="secondary">
                {row.activeLearnerCount} learner{row.activeLearnerCount === 1 ? "" : "s"}
              </Badge>
            </span>
          )
          return (
            <div key={row.parentLeadId || row.children[0]?.learnerId}>
              {content}
              {row.parentLeadId ? (
                <div className="pb-4">
                  <Link
                    className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-semibold hover:bg-muted"
                    href={"/admin/families/" + row.parentLeadId}
                  >
                    Manage
                  </Link>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}

export function FamilyArchiveTable({ rows }: { rows: FamilyArchiveRow[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>Child / learner</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Archived</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>
                  <p className="font-semibold">{row.parentName}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </TableCell>
                <TableCell className="font-semibold">{row.childName}</TableCell>
                <TableCell>{row.reason}</TableCell>
                <TableCell>{formatDate(row.closedAt)}</TableCell>
                <TableCell className="text-right">
                  {row.learnerId ? (
                    <Link
                      className="text-sm font-semibold text-primary hover:underline"
                      href={"/admin/learners/" + row.learnerId}
                    >
                      History
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Lead history
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y border-y md:hidden">
        {rows.map((row) => (
          <div className="py-4" key={row.key}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.childName}</p>
                <p className="text-sm text-muted-foreground">{row.email}</p>
                <p className="mt-1 text-sm">{row.reason}</p>
              </div>
              {row.learnerId ? (
                <Link
                  className="text-sm font-semibold text-primary"
                  href={"/admin/learners/" + row.learnerId}
                >
                  History
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
