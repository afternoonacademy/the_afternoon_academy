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
  rows: FamilyCustomerRow[]
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>Learner</TableHead>
              <TableHead>Recurring place</TableHead>
              <TableHead>Paid through</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.learnerId}>
                <TableCell>
                  <Link
                    className="font-semibold text-primary hover:underline"
                    href={"/admin/families/" + row.parentLeadId}
                  >
                    {row.parentName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </TableCell>
                <TableCell>
                  <p className="font-semibold">{row.learnerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.yearGroup || "Year group to confirm"}
                  </p>
                </TableCell>
                <TableCell>{row.placeSummary}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{formatDate(row.paidThrough)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    className="text-sm font-semibold text-primary hover:underline"
                    href={"/admin/families/" + row.parentLeadId}
                  >
                    Family account
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y border-y md:hidden">
        {rows.map((row) => (
          <Link
            className="flex items-start justify-between gap-4 py-4"
            href={"/admin/families/" + row.parentLeadId}
            key={row.learnerId}
          >
            <span className="min-w-0">
              <span className="block font-semibold">{row.learnerName}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {row.email}
              </span>
              <span className="mt-1 block text-sm">{row.placeSummary}</span>
            </span>
            <Badge className="shrink-0" variant="secondary">
              Paid to {formatDate(row.paidThrough)}
            </Badge>
          </Link>
        ))}
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
