"use client"

import { useState } from "react"

import {
  prepareExactRenewalDraft,
  recordExactRenewalPayment,
} from "@/actions/paid-period"
import {
  releaseRenewalPlace,
  sendRenewalEmail,
  startChildRenewalCase,
} from "@/actions/renewals"
import { PaidPeriodBuilder } from "@/components/admin/paid-period-builder"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FamilyRenewalRow } from "@/lib/admin/family-renewals"

type PricePlan = { id: string; name: string; price_cents: number }

const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value + "T12:00:00Z"))

const iso = (value: Date) => value.toISOString().slice(0, 10)

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

const statusLabel: Record<FamilyRenewalRow["status"], string> = {
  needs_renewal: "Needs renewal",
  renewal_planned: "Renewal planned",
  renewal_contacted: "Contacted — awaiting payment",
}

export function RenewalWorkflowTable({
  rows,
  pricePlans,
}: {
  rows: FamilyRenewalRow[]
  pricePlans: PricePlan[]
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b bg-muted/30 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="w-[170px] px-4 py-3 font-medium">Learner</th>
              <th className="w-[150px] px-4 py-3 font-medium">Last paid</th>
              <th className="w-[220px] px-4 py-3 font-medium">Status</th>
              <th className="w-[100px] px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const open = expanded === row.learnerId
              return (
                <>
                  <tr
                    className="border-b last:border-0 hover:bg-muted/30"
                    key={row.learnerId}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold">{row.parentName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{row.learnerName}</td>
                    <td className="px-4 py-3">{date(row.lastPaidServiceDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{statusLabel[row.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        onClick={() =>
                          setExpanded((current) =>
                            current === row.learnerId ? null : row.learnerId,
                          )
                        }
                        size="sm"
                        type="button"
                        variant={open ? "secondary" : "ghost"}
                      >
                        {open ? "Close" : "Details"}
                      </Button>
                    </td>
                  </tr>
                  {open ? (
                    <tr key={row.learnerId + "-details"}>
                      <td className="bg-muted/20 px-4 py-5" colSpan={5}>
                        <RenewalActions pricePlans={pricePlans} row={row} />
                      </td>
                    </tr>
                  ) : null}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y border-y md:hidden">
        {rows.map((row) => {
          const open = expanded === row.learnerId
          return (
            <div className="py-4" key={row.learnerId}>
              <button
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() =>
                  setExpanded((current) =>
                    current === row.learnerId ? null : row.learnerId,
                  )
                }
                type="button"
              >
                <span>
                  <span className="block font-semibold">
                    {row.learnerName} · {row.parentName}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Last paid {date(row.lastPaidServiceDate)}
                  </span>
                  <span className="mt-2 inline-block">
                    <Badge variant="secondary">{statusLabel[row.status]}</Badge>
                  </span>
                </span>
                <span className="text-sm font-semibold text-primary">
                  {open ? "Close" : "Details"}
                </span>
              </button>
              {open ? (
                <div className="mt-4 border-t pt-4">
                  <RenewalActions pricePlans={pricePlans} row={row} />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}

function RenewalActions({
  row,
  pricePlans,
}: {
  row: FamilyRenewalRow
  pricePlans: PricePlan[]
}) {
  const [editing, setEditing] = useState(row.status === "needs_renewal")

  const nextStart = new Date(row.lastPaidServiceDate + "T12:00:00Z")
  nextStart.setUTCDate(nextStart.getUTCDate() + 1)
  const nextEnd = new Date(nextStart)
  nextEnd.setUTCDate(nextEnd.getUTCDate() + 31)
  const suggestionStart = row.proposedPeriodStart || iso(nextStart)
  const suggestionEnd = row.proposedPeriodEnd || iso(nextEnd)

  const amount =
    row.proposedAmountCents ??
    row.selectedSessions.reduce((sum, session) => sum + session.priceCents, 0)

  const firstPlacement = row.placements[0]

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-background p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-semibold">Recurring place remains reserved</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {row.learnerName} keeps this recurring capacity after the paid
              period ends. It is not offered to another family unless an admin
              explicitly releases it.
            </p>
          </div>
          <Badge variant={row.recurringCapacityHeld ? "default" : "destructive"}>
            {row.recurringCapacityHeld
              ? "Capacity reserved"
              : "Check recurring capacity hold"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {row.placements.map((placement) => (
            <div className="rounded-lg border p-3" key={placement.placementId}>
              <p className="font-semibold">
                Table {placement.tableNumber} · {placement.startsAt}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {placement.pricePlanName} · {money(placement.priceCents)} / session
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Capacity seat{" "}
                {placement.seatNumber
                  ? placement.seatNumber
                  : "held by recurring booking"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {!row.caseId ? (
        <section className="rounded-xl border bg-background p-4">
          <p className="font-semibold">1 · Plan the next paid period</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Last paid service: {date(row.lastPaidServiceDate)}. Start the
            renewal using the learner’s current recurring place and price plan.
          </p>
          <div className="mt-4 max-w-sm">
            <SaveActionForm
              action={startChildRenewalCase}
              submitLabel="Start renewal plan"
              successMessage="Renewal opened"
            >
              <input name="parentLeadId" type="hidden" value={row.parentLeadId} />
              <input name="learnerId" type="hidden" value={row.learnerId} />
              <input
                name="standingPlacementId"
                type="hidden"
                value={firstPlacement?.placementId || ""}
              />
              <input
                name="sourcePaymentEntitlementId"
                type="hidden"
                value={row.sourcePaymentEntitlementId}
              />
              <input name="dueOn" type="hidden" value={row.periodEnd} />
            </SaveActionForm>
          </div>
        </section>
      ) : null}

      {row.caseId && (editing || !row.selectedSessions.length) ? (
        <section className="rounded-xl border bg-background p-4">
          <div className="mb-4">
            <p className="font-semibold">1 · Plan renewal dates</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The learner’s existing table/time is the default. Review the exact
              next dates, closures and price plan before contacting the parent.
            </p>
          </div>
          <SaveActionForm
            action={prepareExactRenewalDraft}
            submitLabel="Record renewal plan"
            successMessage="Renewal plan saved"
          >
            <input name="caseId" type="hidden" value={row.caseId} />
            <input name="parentLeadId" type="hidden" value={row.parentLeadId} />
            <PaidPeriodBuilder
              allowPricePlanChange
              closures={row.closures}
              initialSessions={row.selectedSessions}
              placements={row.placements}
              pricePlans={pricePlans}
              purpose="plan"
              suggestionEnd={suggestionEnd}
              suggestionStart={suggestionStart}
            />
          </SaveActionForm>
        </section>
      ) : null}

      {row.caseId && row.selectedSessions.length && !editing ? (
        <section className="rounded-xl border bg-background p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-semibold">Saved renewal plan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {row.selectedSessions.length} session
                {row.selectedSessions.length === 1 ? "" : "s"} · {money(amount)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {row.selectedSessions.map((session) => (
                  <span
                    className="rounded-md border bg-muted/20 px-2.5 py-1 text-xs"
                    key={
                      session.placementId +
                      ":" +
                      session.date +
                      ":" +
                      session.startsAt
                    }
                  >
                    {date(session.date)} · Table {session.tableNumber} · {session.startsAt} · Table {session.tableNumber} · {session.startsAt}
                  </span>
                ))}
              </div>
            </div>
            {row.status !== "renewal_contacted" ? (
              <Button
                onClick={() => setEditing(true)}
                size="sm"
                type="button"
                variant="outline"
              >
                Edit renewal plan
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {row.caseId &&
      row.selectedSessions.length &&
      row.status === "renewal_planned" &&
      !editing ? (
        <section className="rounded-xl border bg-background p-4">
          <p className="font-semibold">2 · Contact parent</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Send the Academy renewal email generated from the saved renewal
            template and these exact dates. A successful send changes this
            learner to Contacted — awaiting payment.
          </p>
          <div className="mt-4 max-w-sm">
            <SaveActionForm
              action={sendRenewalEmail}
              submitLabel="Email renewal to parent"
              successMessage="Renewal sent — awaiting payment"
            >
              <input name="caseId" type="hidden" value={row.caseId} />
              <input name="parentLeadId" type="hidden" value={row.parentLeadId} />
              <input
                name="subject"
                type="hidden"
                value={row.draftSubject || ""}
              />
              <input
                name="body"
                type="hidden"
                value={row.draftBody || ""}
              />
            </SaveActionForm>
          </div>
        </section>
      ) : null}

      {row.caseId &&
      row.selectedSessions.length &&
      row.status === "renewal_contacted" ? (
        <section className="rounded-xl border bg-background p-4">
          <p className="font-semibold">3 · Confirm cleared renewal payment</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The recurring place is still reserved. Confirm the transfer only
            after the planned amount has cleared.
          </p>

          <div className="mt-4 rounded-lg border bg-muted/20 p-4">
            <p className="font-semibold">{row.learnerName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {row.selectedSessions.length} planned session
              {row.selectedSessions.length === 1 ? "" : "s"} · {money(amount)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {row.selectedSessions.map((session) => (
                <span
                  className="rounded-md border bg-background px-2.5 py-1 text-xs"
                  key={session.placementId + ":" + session.date}
                >
                  {date(session.date)}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <SaveActionForm
              action={recordExactRenewalPayment}
              submitLabel={
                "Confirm payment & activate " +
                row.selectedSessions.length +
                " date" +
                (row.selectedSessions.length === 1 ? "" : "s")
              }
              successMessage="Renewal payment confirmed"
            >
              <input name="caseId" type="hidden" value={row.caseId} />
              <input name="parentLeadId" type="hidden" value={row.parentLeadId} />
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
              <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
                <input className="mt-0.5" required type="checkbox" />
                <span>
                  I confirm the renewal payment has cleared for the planned
                  amount and dates shown above.
                </span>
              </label>
            </SaveActionForm>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-destructive/20 bg-background p-4">
          <p className="font-semibold">Release recurring place</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use this only when the parent cancels or staff decide to release the
            place for non-payment. This ends the standing placement and returns
            the capacity to the Family Pipeline.
          </p>
          <div className="mt-4 max-w-xl">
            <SaveActionForm
              action={releaseRenewalPlace}
              submitLabel="Release recurring place"
              successMessage="Recurring place released"
            >
              <input name="caseId" type="hidden" value={row.caseId || ""} />
              <input name="parentLeadId" type="hidden" value={row.parentLeadId} />
              <input name="learnerId" type="hidden" value={row.learnerId} />
              <input
                name="sourcePaymentEntitlementId"
                type="hidden"
                value={row.sourcePaymentEntitlementId}
              />
              <Input
                name="reason"
                placeholder="Required reason — e.g. parent cancelled or non-payment"
                required
              />
            </SaveActionForm>
          </div>
        </section>
    </div>
  )
}
