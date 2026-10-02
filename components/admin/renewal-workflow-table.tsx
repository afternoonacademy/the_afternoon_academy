"use client"

import { useState } from "react"

import {
  prepareExactRenewalDraft,
  recordExactRenewalPayment,
} from "@/actions/paid-period"
import {
  allowPendingRenewalAttendance,
  closeRenewal,
  sendRenewalEmail,
  startRenewalCase,
} from "@/actions/renewals"
import { PaidPeriodBuilder } from "@/components/admin/paid-period-builder"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type {
  AcademyClosure,
  PaidPeriodPlacement,
  PaidPeriodSession,
} from "@/lib/paid-period"

type LegacyRenewalSession = {
  date: string
  startsAt: string
  priceCents: number
}

export type RenewalWorkflowRow = {
  sourcePaymentEntitlementId: string
  parentLeadId: string
  parentName: string
  email: string
  learnerNames: string[]
  periodEnd: string
  lastPaidServiceDate: string
  caseId: string | null
  status:
    | "ready_to_send"
    | "awaiting_payment"
    | "overdue"
    | "renewed"
    | "not_renewing"
  emailSentAt: string | null
  proposedPeriodStart: string | null
  proposedPeriodEnd: string | null
  proposedAmountCents: number | null
  proposedServiceDates: string[]
  selectedSessions: PaidPeriodSession[]
  legacySelectedSessions: LegacyRenewalSession[]
  placements: PaidPeriodPlacement[]
  closures: AcademyClosure[]
  draftSubject: string | null
  draftBody: string | null
  provisionalDeliveryUntil: string | null
}

const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`))

const iso = (value: Date) => value.toISOString().slice(0, 10)
const price = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

const statusLabel: Record<RenewalWorkflowRow["status"], string> = {
  ready_to_send: "Prepare email",
  awaiting_payment: "Awaiting funds",
  overdue: "Overdue",
  renewed: "Renewed",
  not_renewing: "Not renewing",
}

type PricePlan = { id: string; name: string; price_cents: number }

export function RenewalWorkflowTable({
  rows,
  pricePlans,
}: {
  rows: RenewalWorkflowRow[]
  pricePlans: PricePlan[]
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const toggle = (id: string) => setExpanded(expanded === id ? null : id)

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Family</th>
              <th className="px-4 py-3 font-medium">Learner(s)</th>
              <th className="px-4 py-3 font-medium">Last paid session</th>
              <th className="px-4 py-3 font-medium">Renewal status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <>
                <tr
                  className="border-b last:border-0 hover:bg-muted/30"
                  key={row.sourcePaymentEntitlementId}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.parentName}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">{row.learnerNames.join(", ")}</td>
                  <td className="px-4 py-3 font-medium">
                    {date(row.lastPaidServiceDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        row.status === "overdue"
                          ? "destructive"
                          : row.status === "renewed"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {statusLabel[row.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      onClick={() => toggle(row.sourcePaymentEntitlementId)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {expanded === row.sourcePaymentEntitlementId
                        ? "Close"
                        : "Open"}
                    </Button>
                  </td>
                </tr>
                {expanded === row.sourcePaymentEntitlementId ? (
                  <tr key={`${row.sourcePaymentEntitlementId}-detail`}>
                    <td className="bg-muted/20 px-4 py-5" colSpan={5}>
                      <RenewalActions pricePlans={pricePlans} row={row} />
                    </td>
                  </tr>
                ) : null}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y border-y md:hidden">
        {rows.map((row) => (
          <div className="py-4" key={row.sourcePaymentEntitlementId}>
            <button
              className="flex w-full items-start justify-between gap-3 text-left"
              onClick={() => toggle(row.sourcePaymentEntitlementId)}
              type="button"
            >
              <span>
                <span className="block font-semibold">{row.parentName}</span>
                <span className="block text-sm text-muted-foreground">
                  {row.learnerNames.join(", ")} · last paid{" "}
                  {date(row.lastPaidServiceDate)}
                </span>
              </span>
              <Badge
                variant={row.status === "overdue" ? "destructive" : "secondary"}
              >
                {statusLabel[row.status]}
              </Badge>
            </button>
            {expanded === row.sourcePaymentEntitlementId ? (
              <div className="mt-4 border-t pt-4">
                <RenewalActions pricePlans={pricePlans} row={row} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  )
}

function RenewalActions({
  row,
  pricePlans,
}: {
  row: RenewalWorkflowRow
  pricePlans: PricePlan[]
}) {
  const nextStart = new Date(`${row.lastPaidServiceDate}T12:00:00Z`)
  nextStart.setUTCDate(nextStart.getUTCDate() + 1)
  const nextEnd = new Date(nextStart)
  nextEnd.setUTCDate(nextEnd.getUTCDate() + 31)
  const suggestionStart = row.proposedPeriodStart || iso(nextStart)
  const suggestionEnd = row.proposedPeriodEnd || iso(nextEnd)

  if (!row.caseId) {
    return (
      <div>
        <p className="font-semibold">Open this renewal</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Last paid service date: {date(row.lastPaidServiceDate)}. Opening the
          case keeps this family in the queue until renewed or closed.
        </p>
        <div className="mt-3 max-w-sm">
          <SaveActionForm
            action={startRenewalCase}
            submitLabel="Start renewal"
            successMessage="Renewal opened"
          >
            <input
              name="parentLeadId"
              type="hidden"
              value={row.parentLeadId}
            />
            <input
              name="sourcePaymentEntitlementId"
              type="hidden"
              value={row.sourcePaymentEntitlementId}
            />
            <input name="dueOn" type="hidden" value={row.periodEnd} />
          </SaveActionForm>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <section>
        <div className="mb-4">
          <p className="font-semibold">1 · Build the exact next paid period</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Last paid service: {date(row.lastPaidServiceDate)}. Normal recurring
            dates are preselected from each learner’s active place. Closed dates
            are blocked; select another open date to add an explicit replacement.
          </p>
        </div>

        {row.legacySelectedSessions.length ? (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Historical renewal selection</p>
            <p className="mt-1">
              This case contains an older date/time/price selection. It remains
              readable below. Saving the builder will replace the working quote
              with the new structured exact-session format without rewriting the
              historical payment records.
            </p>
            <ul className="mt-2 space-y-1">
              {row.legacySelectedSessions.map((session, index) => (
                <li key={`${session.date}-${session.startsAt}-${index}`}>
                  {date(session.date)} · {session.startsAt} ·{" "}
                  {price(session.priceCents)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <SaveActionForm
          action={prepareExactRenewalDraft}
          submitLabel="Save exact sessions & prepare email"
          successMessage="Renewal dates and email draft prepared"
        >
          <input name="caseId" type="hidden" value={row.caseId} />
          <input name="parentLeadId" type="hidden" value={row.parentLeadId} />
          <PaidPeriodBuilder
            key={`${row.caseId}:${JSON.stringify(row.selectedSessions)}:${suggestionStart}:${suggestionEnd}`}
            allowPricePlanChange
            closures={row.closures}
            initialSessions={row.selectedSessions}
            placements={row.placements}
            pricePlans={pricePlans}
            suggestionEnd={suggestionEnd}
            suggestionStart={suggestionStart}
          />
        </SaveActionForm>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border bg-background p-4">
          <p className="font-semibold">2 · Review and send</p>
          {row.draftSubject && row.draftBody ? (
            <div className="mt-3">
              <SaveActionForm
                action={sendRenewalEmail}
                submitLabel={row.emailSentAt ? "Email sent" : "Send renewal email"}
                successMessage="Renewal email sent"
              >
                <input name="caseId" type="hidden" value={row.caseId} />
                <input
                  name="parentLeadId"
                  type="hidden"
                  value={row.parentLeadId}
                />
                <Input
                  defaultValue={row.draftSubject}
                  name="subject"
                  required
                />
                <textarea
                  className="min-h-56 w-full rounded-md border bg-background p-3 text-sm"
                  defaultValue={row.draftBody}
                  name="body"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The draft is built from the exact selected sessions and total.
                  You can edit the message before sending.
                </p>
              </SaveActionForm>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Save the exact paid sessions first. The editable renewal email is
              generated from that selection.
            </p>
          )}
        </section>

        <section className="rounded-xl border bg-background p-4">
          <p className="font-semibold">3 · Funds cleared or continuity decision</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Operations seats become paid only after you manually confirm cleared
            funds. Late-payment continuation remains explicit and date-bounded.
          </p>

          {row.selectedSessions.length ? (
            <div className="mt-4 border-b pb-4">
              <p className="text-sm font-semibold">
                Confirm cleared payment ·{" "}
                {price(
                  row.proposedAmountCents ??
                    row.selectedSessions.reduce(
                      (sum, session) => sum + session.priceCents,
                      0,
                    ),
                )}
              </p>
              <div className="mt-2">
                <SaveActionForm
                  action={recordExactRenewalPayment}
                  submitLabel="Confirm payment & activate dated seats"
                  successMessage="Renewal payment confirmed and dated seats activated"
                >
                  <input name="caseId" type="hidden" value={row.caseId} />
                  <input
                    name="parentLeadId"
                    type="hidden"
                    value={row.parentLeadId}
                  />
                  <input
                    name="selectedSessions"
                    type="hidden"
                    value={JSON.stringify(row.selectedSessions)}
                  />
                  <Input
                    defaultValue={iso(new Date())}
                    name="receivedOn"
                    required
                    type="date"
                  />
                  <Input name="bankReference" placeholder="Bank reference" />
                  <Input name="note" placeholder="Optional payment note" />
                </SaveActionForm>
              </div>
            </div>
          ) : null}

          <div className="mt-4 border-b pb-4">
            <p className="text-sm font-semibold">Payment pending continuation</p>
            <div className="mt-2">
              <SaveActionForm
                action={allowPendingRenewalAttendance}
                submitLabel="Continue as payment pending"
                successMessage="Payment-pending attendance prepared"
              >
                <input name="caseId" type="hidden" value={row.caseId} />
                <input
                  name="parentLeadId"
                  type="hidden"
                  value={row.parentLeadId}
                />
                <Input
                  defaultValue={row.provisionalDeliveryUntil || suggestionStart}
                  name="throughDate"
                  required
                  type="date"
                />
              </SaveActionForm>
            </div>
            {row.provisionalDeliveryUntil ? (
              <p className="mt-2 text-sm font-medium text-amber-700">
                Pending attendance through {date(row.provisionalDeliveryUntil)}
              </p>
            ) : null}
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold">Family is not renewing</p>
            <div className="mt-2">
              <SaveActionForm
                action={closeRenewal}
                submitLabel="Mark not renewing"
                successMessage="Renewal closed"
              >
                <input name="caseId" type="hidden" value={row.caseId} />
                <input
                  name="parentLeadId"
                  type="hidden"
                  value={row.parentLeadId}
                />
                <Input name="note" placeholder="Optional non-renewal reason" />
              </SaveActionForm>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
