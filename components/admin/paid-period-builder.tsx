"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CircleAlert, RotateCcw } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  closureDatesInRange,
  closureForDate,
  expectedDatesForPlacement,
  paidPeriodSummary,
  sessionFromPlacement,
  sortPaidPeriodSessions,
  type AcademyClosure,
  type PaidPeriodPlacement,
  type PaidPeriodSession,
} from "@/lib/paid-period"

type PricePlan = { id: string; name: string; price_cents: number }

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`))

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

function toDate(value: string) {
  return new Date(`${value}T12:00:00Z`)
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

export function PaidPeriodBuilder({
  placements,
  closures,
  suggestionStart,
  suggestionEnd,
  initialSessions = [],
  inputName = "selectedSessions",
  pricePlans = [],
  allowPricePlanChange = false,
}: {
  placements: PaidPeriodPlacement[]
  closures: AcademyClosure[]
  suggestionStart: string
  suggestionEnd: string
  initialSessions?: PaidPeriodSession[]
  inputName?: string
  pricePlans?: PricePlan[]
  allowPricePlanChange?: boolean
}) {
  const initialSelection = () =>
    sortPaidPeriodSessions(
      initialSessions.length
        ? placements.flatMap((placement) =>
            initialSessions.filter(
              (session) => session.placementId === placement.placementId,
            ),
          )
        : placements.flatMap((placement) =>
            expectedDatesForPlacement(
              placement,
              suggestionStart,
              suggestionEnd,
              closures,
            ).map((date) => sessionFromPlacement(placement, date, false)),
          ),
    )

  const [sessions, setSessions] = useState<PaidPeriodSession[]>(initialSelection)

  const summary = paidPeriodSummary(sessions)
  const orderedPlacements = useMemo(
    () =>
      [...placements].sort(
        (a, b) =>
          a.learnerName.localeCompare(b.learnerName) ||
          a.startsAt.localeCompare(b.startsAt) ||
          a.tableNumber - b.tableNumber,
      ),
    [placements],
  )
  const closureWarnings = closureDatesInRange(
    closures,
    suggestionStart,
    suggestionEnd,
  )

  function sessionsFor(placementId: string) {
    return sessions.filter((session) => session.placementId === placementId)
  }

  function updateDates(placement: PaidPeriodPlacement, dates: Date[] | undefined) {
    const selected = (dates || []).map(dateKey)
    const other = sessions.filter(
      (session) => session.placementId !== placement.placementId,
    )
    const currentByDate = new Map(
      sessionsFor(placement.placementId).map((session) => [session.date, session]),
    )
    const next = selected.map((date) => {
      const existing = currentByDate.get(date)
      if (existing) return existing
      return sessionFromPlacement(
        placement,
        date,
        new Date(`${date}T12:00:00Z`).getUTCDay() !== placement.weekday,
      )
    })
    setSessions(sortPaidPeriodSessions([...other, ...next]))
  }

  function resetPlacement(placement: PaidPeriodPlacement) {
    const expected = expectedDatesForPlacement(
      placement,
      suggestionStart,
      suggestionEnd,
      closures,
    ).map((date) => sessionFromPlacement(placement, date, false))
    setSessions((current) =>
      sortPaidPeriodSessions([
        ...current.filter(
          (session) => session.placementId !== placement.placementId,
        ),
        ...expected,
      ]),
    )
  }

  function changePlan(placement: PaidPeriodPlacement, pricePlanId: string) {
    const plan = pricePlans.find((item) => item.id === pricePlanId)
    if (!plan) return
    setSessions((current) =>
      current.map((session) =>
        session.placementId === placement.placementId
          ? {
              ...session,
              pricePlanId: plan.id,
              pricePlanName: plan.name,
              priceCents: plan.price_cents,
            }
          : session,
      ),
    )
  }

  if (!placements.length) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Choose the learner, table, time, seat and price plan to load the paid
        service dates.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <input
        name={inputName}
        type="hidden"
        value={JSON.stringify(sortPaidPeriodSessions(sessions))}
      />

      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="font-semibold">Exact paid service dates</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Expected recurring dates are preselected. Deselect any date the
              family is not paying for. Selecting an open date on another
              weekday records it as a replacement session.
            </p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Suggested period: {dateLabel(suggestionStart)} –{" "}
              {dateLabel(suggestionEnd)}
            </p>
          </div>
        </div>
      </div>

      {closureWarnings.length ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <div className="flex gap-2">
            <CircleAlert className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">Academy closure dates</p>
              <p className="mt-1 text-sm">
                These dates cannot be selected. A replacement may be needed
                where a normal recurring session falls on a closure.
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {closureWarnings.map((closure) => (
                  <li key={`${closure.date}-${closure.reason}`}>
                    <strong>{dateLabel(closure.date)}</strong> — {closure.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {orderedPlacements.map((placement) => {
          const selected = sessionsFor(placement.placementId)
          const selectedDates = selected.map((session) => toDate(session.date))
          const planId = selected[0]?.pricePlanId || placement.pricePlanId

          return (
            <section
              className="rounded-xl border bg-background p-4"
              key={placement.placementId}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                <div>
                  <h4 className="text-lg font-bold">{placement.learnerName}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Table {placement.tableNumber} · {placement.startsAt.slice(0, 5)} ·
                    Seat {placement.seatNumber}
                  </p>
                  <p className="mt-1 text-sm">
                    {selected[0]?.pricePlanName || placement.pricePlanName} ·{" "}
                    {money(selected[0]?.priceCents ?? placement.priceCents)} per
                    session
                  </p>
                </div>
                <Button
                  onClick={() => resetPlacement(placement)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw className="size-4" />
                  Reset expected dates
                </Button>
              </div>

              {allowPricePlanChange && pricePlans.length ? (
                <label className="mt-4 grid max-w-md gap-1 text-sm font-medium">
                  Price plan for this learner
                  <select
                    className="h-10 rounded-md border bg-background px-3 font-normal"
                    onChange={(event) =>
                      changePlan(placement, event.target.value)
                    }
                    value={planId}
                  >
                    {pricePlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {money(plan.price_cents)}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-normal text-muted-foreground">
                    Changing the price plan does not move this learner’s table,
                    time or seat.
                  </span>
                </label>
              ) : null}

              <div className="mt-4 grid gap-5 lg:grid-cols-[auto_1fr]">
                <div className="overflow-x-auto">
                  <Calendar
                    disabled={(day) =>
                      Boolean(closureForDate(dateKey(day), closures))
                    }
                    mode="multiple"
                    modifiers={{
                      closure: (day) =>
                        Boolean(closureForDate(dateKey(day), closures)),
                      expected: (day) =>
                        day.getDay() === placement.weekday &&
                        !closureForDate(dateKey(day), closures),
                    }}
                    modifiersClassNames={{
                      closure:
                        "bg-amber-100 text-amber-900 line-through opacity-70",
                      expected:
                        "ring-1 ring-inset ring-primary/30 data-[selected=true]:ring-0",
                    }}
                    onSelect={(dates) => updateDates(placement, dates)}
                    selected={selectedDates}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    {placement.learnerName}’s selected dates
                  </p>
                  {selected.length ? (
                    <div className="mt-2 overflow-hidden rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-medium">Date</th>
                            <th className="px-3 py-2 font-medium">Place</th>
                            <th className="px-3 py-2 font-medium">Type</th>
                            <th className="px-3 py-2 text-right font-medium">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.map((session) => (
                            <tr
                              className="border-t"
                              key={`${session.placementId}-${session.date}-${session.startsAt}`}
                            >
                              <td className="px-3 py-2 font-medium">
                                {dateLabel(session.date)}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                Table {session.tableNumber} · {session.startsAt} ·
                                Seat {session.seatNumber}
                              </td>
                              <td className="px-3 py-2">
                                {session.replacement ? (
                                  <span className="font-medium text-amber-700">
                                    Replacement
                                  </span>
                                ) : (
                                  "Recurring"
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {money(session.priceCents)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No paid dates selected for this learner.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <div className="grid divide-y rounded-xl border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Selected sessions
          </p>
          <p className="mt-1 text-2xl font-bold">{summary.count}</p>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Paid date span
          </p>
          <p className="mt-1 text-sm font-semibold">
            {summary.periodStart && summary.periodEnd
              ? `${dateLabel(summary.periodStart)} – ${dateLabel(summary.periodEnd)}`
              : "Choose at least one date"}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Calculated total
          </p>
          <p className="mt-1 text-2xl font-bold">
            {money(summary.amountCents)}
          </p>
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground">
        After manual payment confirmation, these exact dates are the dates that
        will create dated Operations sessions and seats.
      </p>
    </div>
  )
}
