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

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

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
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function learnerKey(placement: PaidPeriodPlacement) {
  return placement.learnerId || placement.childLeadId || placement.learnerName
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
  purpose = "payment",
}: {
  placements: PaidPeriodPlacement[]
  closures: AcademyClosure[]
  suggestionStart: string
  suggestionEnd: string
  initialSessions?: PaidPeriodSession[]
  inputName?: string
  pricePlans?: PricePlan[]
  allowPricePlanChange?: boolean
  purpose?: "plan" | "payment"
}) {
  const initialSelection = () =>
    sortPaidPeriodSessions(
      initialSessions.length
        ? initialSessions
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
  const [replacementPlacementByLearner, setReplacementPlacementByLearner] =
    useState<Record<string, string>>({})
  const [replacementDateByLearner, setReplacementDateByLearner] =
    useState<Record<string, string>>({})

  const summary = paidPeriodSummary(sessions)

  const learnerGroups = useMemo(() => {
    const groups = new Map<
      string,
      { learnerName: string; placements: PaidPeriodPlacement[] }
    >()
    for (const placement of placements) {
      const key = learnerKey(placement)
      const current = groups.get(key) || {
        learnerName: placement.learnerName,
        placements: [],
      }
      current.placements.push(placement)
      groups.set(key, current)
    }
    return [...groups.entries()].map(([key, group]) => ({
      key,
      learnerName: group.learnerName,
      placements: [...group.placements].sort(
        (a, b) =>
          a.weekday - b.weekday ||
          a.startsAt.localeCompare(b.startsAt) ||
          a.tableNumber - b.tableNumber,
      ),
    }))
  }, [placements])

  const closureWarnings = closureDatesInRange(
    closures,
    suggestionStart,
    suggestionEnd,
  )

  function sessionsForLearner(key: string) {
    const ids = new Set(
      learnerGroups
        .find((group) => group.key === key)
        ?.placements.map((placement) => placement.placementId) || [],
    )
    return sessions.filter((session) => ids.has(session.placementId))
  }

  function expectedPlacementsForDate(
    groupPlacements: PaidPeriodPlacement[],
    date: string,
  ) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
    return groupPlacements.filter(
      (placement) =>
        placement.weekday === weekday && !closureForDate(date, closures),
    )
  }

  function updateLearnerDates(
    key: string,
    groupPlacements: PaidPeriodPlacement[],
    dates: Date[] | undefined,
  ) {
    const selectedDates = new Set((dates || []).map(dateKey))
    const placementIds = new Set(
      groupPlacements.map((placement) => placement.placementId),
    )
    const otherLearners = sessions.filter(
      (session) => !placementIds.has(session.placementId),
    )
    const current = sessions.filter((session) =>
      placementIds.has(session.placementId),
    )
    const currentByKey = new Map(
      current.map((session) => [
        `${session.placementId}|${session.date}`,
        session,
      ]),
    )

    const next: PaidPeriodSession[] = []
    for (const date of selectedDates) {
      const expectedPlacements = expectedPlacementsForDate(
        groupPlacements,
        date,
      )

      if (expectedPlacements.length) {
        for (const placement of expectedPlacements) {
          const existing = currentByKey.get(
            `${placement.placementId}|${date}`,
          )
          next.push(
            existing || sessionFromPlacement(placement, date, false),
          )
        }

        for (const existing of current.filter(
          (session) => session.date === date && session.replacement,
        )) {
          next.push(existing)
        }
        continue
      }

      const existingReplacement = current.find(
        (session) => session.date === date && session.replacement,
      )
      if (existingReplacement) {
        next.push(existingReplacement)
        continue
      }

      const replacementPlacementId =
        replacementPlacementByLearner[key] ||
        groupPlacements[0]?.placementId
      const placement = groupPlacements.find(
        (item) => item.placementId === replacementPlacementId,
      )
      if (placement) {
        next.push(sessionFromPlacement(placement, date, true))
      }
    }

    setSessions(sortPaidPeriodSessions([...otherLearners, ...next]))
  }

  function addReplacement(
    key: string,
    groupPlacements: PaidPeriodPlacement[],
  ) {
    const date = replacementDateByLearner[key]
    const placementId =
      replacementPlacementByLearner[key] ||
      groupPlacements[0]?.placementId
    const placement = groupPlacements.find(
      (item) => item.placementId === placementId,
    )
    if (!date || !placement || closureForDate(date, closures)) return
    if (
      sessions.some(
        (session) =>
          session.placementId === placement.placementId &&
          session.date === date,
      )
    ) {
      return
    }
    setSessions((current) =>
      sortPaidPeriodSessions([
        ...current,
        sessionFromPlacement(placement, date, true),
      ]),
    )
    setReplacementDateByLearner((current) => ({
      ...current,
      [key]: "",
    }))
  }

  function resetLearner(groupPlacements: PaidPeriodPlacement[]) {
    const ids = new Set(groupPlacements.map((item) => item.placementId))
    const expected = groupPlacements.flatMap((placement) =>
      expectedDatesForPlacement(
        placement,
        suggestionStart,
        suggestionEnd,
        closures,
      ).map((date) => sessionFromPlacement(placement, date, false)),
    )
    setSessions((current) =>
      sortPaidPeriodSessions([
        ...current.filter((session) => !ids.has(session.placementId)),
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
        Choose at least one recurring table/time and price plan to load the
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
            <p className="font-semibold">
              {purpose === "plan"
                ? "Planned service dates"
                : "Exact paid service dates"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              One calendar covers all recurring days for each learner. Expected
              dates from every active place are preselected. Deselect any date
              not included in this period. For an open-date replacement, choose
              which recurring place it replaces, then select the new date.
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
                    <strong>{dateLabel(closure.date)}</strong> —{" "}
                    {closure.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {learnerGroups.map((group) => {
          const selected = sessionsForLearner(group.key)
          const selectedDates = [
            ...new Set(selected.map((session) => session.date)),
          ].map(toDate)
          const replacementPlacementId =
            replacementPlacementByLearner[group.key] ||
            group.placements[0]?.placementId ||
            ""

          return (
            <section
              className="rounded-xl border bg-background p-4"
              key={group.key}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                <div>
                  <h4 className="text-lg font-bold">{group.learnerName}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {group.placements.length} recurring place
                    {group.placements.length === 1 ? "" : "s"} combined in one
                    calendar
                  </p>
                </div>
                <Button
                  onClick={() => resetLearner(group.placements)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw className="size-4" />
                  Reset expected dates
                </Button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {group.placements.map((placement) => {
                  const placementSessions = sessions.filter(
                    (session) =>
                      session.placementId === placement.placementId,
                  )
                  const currentPlanId =
                    placementSessions[0]?.pricePlanId || placement.pricePlanId
                  return (
                    <div
                      className="rounded-lg border bg-muted/10 p-3"
                      key={placement.placementId}
                    >
                      <p className="font-semibold">
                        {days[placement.weekday]} ·{" "}
                        {placement.startsAt.slice(0, 5)} · Table{" "}
                        {placement.tableNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {placement.seatNumber
                          ? `Capacity seat ${placement.seatNumber}`
                          : "Seat assigned when payment clears"}
                      </p>
                      {allowPricePlanChange && pricePlans.length ? (
                        <select
                          className="mt-2 h-9 w-full rounded-md border bg-background px-2 text-sm"
                          onChange={(event) =>
                            changePlan(placement, event.target.value)
                          }
                          value={currentPlanId}
                        >
                          {pricePlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} · {money(plan.price_cents)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="mt-2 text-sm">
                          {placementSessions[0]?.pricePlanName ||
                            placement.pricePlanName}{" "}
                          ·{" "}
                          {money(
                            placementSessions[0]?.priceCents ??
                              placement.priceCents,
                          )}{" "}
                          / session
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 grid gap-3 rounded-lg border bg-muted/10 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="grid gap-1 text-sm font-medium">
                  Replacement for
                  <select
                    className="h-10 rounded-md border bg-background px-3 font-normal"
                    onChange={(event) =>
                      setReplacementPlacementByLearner((current) => ({
                        ...current,
                        [group.key]: event.target.value,
                      }))
                    }
                    value={replacementPlacementId}
                  >
                    {group.placements.map((placement) => (
                      <option
                        key={placement.placementId}
                        value={placement.placementId}
                      >
                        {days[placement.weekday]} ·{" "}
                        {placement.startsAt.slice(0, 5)} · Table{" "}
                        {placement.tableNumber}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Open replacement date
                  <input
                    className="h-10 rounded-md border bg-background px-3 font-normal"
                    min={suggestionStart}
                    max={suggestionEnd}
                    onChange={(event) =>
                      setReplacementDateByLearner((current) => ({
                        ...current,
                        [group.key]: event.target.value,
                      }))
                    }
                    type="date"
                    value={replacementDateByLearner[group.key] || ""}
                  />
                </label>
                <Button
                  disabled={
                    !replacementDateByLearner[group.key] ||
                    Boolean(
                      closureForDate(
                        replacementDateByLearner[group.key] || "",
                        closures,
                      ),
                    )
                  }
                  onClick={() =>
                    addReplacement(group.key, group.placements)
                  }
                  type="button"
                  variant="outline"
                >
                  Add replacement
                </Button>
                <p className="text-xs text-muted-foreground sm:col-span-3">
                  Use this when the replacement falls on a date already selected
                  for another recurring day, or when you want to make the
                  replaced place explicit.
                </p>
              </div>

              <div className="mt-4 grid gap-5 xl:grid-cols-[auto_1fr]">
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
                        group.placements.some(
                          (placement) =>
                            day.getDay() === placement.weekday,
                        ) &&
                        !closureForDate(dateKey(day), closures),
                    }}
                    modifiersClassNames={{
                      closure:
                        "bg-amber-100 text-amber-900 line-through opacity-70",
                      expected:
                        "ring-1 ring-inset ring-primary/30 data-[selected=true]:ring-0",
                    }}
                    onSelect={(dates) =>
                      updateLearnerDates(
                        group.key,
                        group.placements,
                        dates,
                      )
                    }
                    selected={selectedDates}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    {group.learnerName}’s selected dates
                  </p>
                  {selected.length ? (
                    <div className="mt-2 overflow-hidden rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-medium">Date</th>
                            <th className="px-3 py-2 font-medium">Recurring place</th>
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
                                {days[
                                  group.placements.find(
                                    (item) =>
                                      item.placementId ===
                                      session.placementId,
                                  )?.weekday ?? 0
                                ]}{" "}
                                · Table {session.tableNumber} ·{" "}
                                {session.startsAt}
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
                    <p className="mt-2 text-sm text-muted-foreground">
                      No service dates selected.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
        <div>
          <p className="text-sm font-semibold">Selected period total</p>
          <p className="text-xs text-muted-foreground">
            {summary.count} session{summary.count === 1 ? "" : "s"}
            {summary.periodStart && summary.periodEnd
              ? ` · ${dateLabel(summary.periodStart)} – ${dateLabel(summary.periodEnd)}`
              : ""}
          </p>
        </div>
        <p className="text-xl font-bold">{money(summary.amountCents)}</p>
      </div>

      <p className="text-sm font-medium text-muted-foreground">
        {purpose === "plan"
          ? "Saving this plan holds all selected recurring capacity places and prepares one combined parent quote. It does not create payment or dated Operations attendance."
          : "After manual payment confirmation, these exact dates are the dates that will create dated Operations sessions and seats."}
      </p>
    </div>
  )
}
