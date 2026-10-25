"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CircleAlert, RotateCcw, X } from "lucide-react"

import { InfoTip } from "@/components/admin/info-tip"

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
const longDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

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
  const [activePlacementByLearner, setActivePlacementByLearner] =
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

  function sessionsForLearner(groupPlacements: PaidPeriodPlacement[]) {
    const ids = new Set(groupPlacements.map((item) => item.placementId))
    return sessions.filter((session) => ids.has(session.placementId))
  }

  function sessionsForPlacement(placementId: string) {
    return sessions.filter((session) => session.placementId === placementId)
  }

  function activePlacementFor(
    key: string,
    groupPlacements: PaidPeriodPlacement[],
  ) {
    const activeId =
      activePlacementByLearner[key] || groupPlacements[0]?.placementId
    return (
      groupPlacements.find((placement) => placement.placementId === activeId) ||
      groupPlacements[0]
    )
  }

  function updateRecurringDates(
    placement: PaidPeriodPlacement,
    dates: Date[] | undefined,
  ) {
    const selectedDates = new Set((dates || []).map(dateKey))

    setSessions((current) => {
      const otherSessions = current.filter(
        (session) =>
          session.placementId !== placement.placementId ||
          session.replacement ||
          session.sessionOrigin === "pre_agreed_exception",
      )
      const currentRecurring = current.filter(
        (session) =>
          session.placementId === placement.placementId &&
          !session.replacement &&
          session.sessionOrigin !== "pre_agreed_exception",
      )
      const currentByDate = new Map(
        currentRecurring.map((session) => [session.date, session]),
      )

      const nextRecurring = [...selectedDates].map(
        (date) =>
          currentByDate.get(date) ||
          sessionFromPlacement(placement, date, false),
      )

      return sortPaidPeriodSessions([...otherSessions, ...nextRecurring])
    })
  }

  function addReplacement(
    key: string,
    placement: PaidPeriodPlacement,
  ) {
    const date = replacementDateByLearner[key]
    if (!date || closureForDate(date, closures)) return

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
        sessionFromPlacement(
          placement,
          date,
          purpose === "plan" ? false : true,
          purpose === "plan" ? "pre_agreed_exception" : "replacement",
        ),
      ]),
    )
    setReplacementDateByLearner((current) => ({
      ...current,
      [key]: "",
    }))
  }

  function removeSession(target: PaidPeriodSession) {
    setSessions((current) =>
      current.filter(
        (session) =>
          !(
            session.placementId === target.placementId &&
            session.date === target.date &&
            session.startsAt === target.startsAt
          ),
      ),
    )
  }

  function resetPlacement(placement: PaidPeriodPlacement) {
    setSessions((current) => {
      const currentPlan = current.find(
        (session) => session.placementId === placement.placementId,
      )
      const pricedPlacement = currentPlan
        ? {
            ...placement,
            pricePlanId: currentPlan.pricePlanId,
            pricePlanName: currentPlan.pricePlanName,
            priceCents: currentPlan.priceCents,
          }
        : placement

      const expected = expectedDatesForPlacement(
        pricedPlacement,
        suggestionStart,
        suggestionEnd,
        closures,
      ).map((date) => sessionFromPlacement(pricedPlacement, date, false))

      return sortPaidPeriodSessions([
        ...current.filter(
          (session) => session.placementId !== placement.placementId,
        ),
        ...expected,
      ])
    })
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
            <div className="flex items-center gap-1.5">
              <p className="font-semibold">
                {purpose === "plan"
                  ? "Planned first-period service dates"
                  : "Exact paid service dates"}
              </p>
              <InfoTip label="About the paid-period calendar">
                Choose one recurring day at a time. The calendar only edits the
                active day/place, while the selected-dates table always shows
                the learner&apos;s complete combined period.
              </InfoTip>
            </div>
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
                Closure dates cannot be selected. Use the active recurring-day
                tab to add an agreed first-period date if you have arranged one
                with the family.
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
          const learnerSessions = sessionsForLearner(group.placements)
          const activePlacement = activePlacementFor(
            group.key,
            group.placements,
          )
          if (!activePlacement) return null

          const activeSessions = sessionsForPlacement(
            activePlacement.placementId,
          )
          const activeRecurringSessions = activeSessions.filter(
            (session) =>
              !session.replacement &&
              session.sessionOrigin !== "pre_agreed_exception",
          )
          const activeReplacementSessions = activeSessions.filter(
            (session) =>
              session.replacement ||
              session.sessionOrigin === "pre_agreed_exception",
          )
          const activeSelectedDates = activeRecurringSessions.map((session) =>
            toDate(session.date),
          )
          const activeClosureWarnings = closureWarnings.filter(
            (closure) =>
              new Date(`${closure.date}T12:00:00Z`).getUTCDay() ===
              activePlacement.weekday,
          )
          const activePlanId =
            activeSessions[0]?.pricePlanId || activePlacement.pricePlanId

          return (
            <section
              className="rounded-xl border bg-background p-4"
              key={group.key}
            >
              <div className="border-b pb-4">
                <h4 className="text-lg font-bold">{group.learnerName}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.placements.length} recurring place
                  {group.placements.length === 1 ? "" : "s"} combined in one
                  paid period
                </p>

                <div
                  aria-label={`${group.learnerName} recurring places`}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {group.placements.map((placement) => {
                    const count = sessionsForPlacement(
                      placement.placementId,
                    ).length
                    const active =
                      placement.placementId ===
                      activePlacement.placementId

                    return (
                      <Button
                        aria-pressed={active}
                        key={placement.placementId}
                        onClick={() =>
                          setActivePlacementByLearner((current) => ({
                            ...current,
                            [group.key]: placement.placementId,
                          }))
                        }
                        type="button"
                        variant={active ? "default" : "outline"}
                      >
                        {days[placement.weekday]} ·{" "}
                        {placement.startsAt.slice(0, 5)} · Table{" "}
                        {placement.tableNumber}
                        <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.5 text-[11px]">
                          {count} date{count === 1 ? "" : "s"}
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-xl border bg-muted/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Editing
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {longDays[activePlacement.weekday]} ·{" "}
                      {activePlacement.startsAt.slice(0, 5)} · Table{" "}
                      {activePlacement.tableNumber}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Only this recurring place can be changed in the calendar
                      below.
                    </p>
                  </div>

                  <Button
                    onClick={() => resetPlacement(activePlacement)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <RotateCcw className="size-4" />
                    Reset {days[activePlacement.weekday]}
                  </Button>
                </div>

                {allowPricePlanChange && pricePlans.length ? (
                  <label className="mt-4 grid max-w-md gap-1 text-sm font-medium">
                    Price plan for {days[activePlacement.weekday]}
                    <select
                      className="h-10 rounded-md border bg-background px-3 font-normal"
                      onChange={(event) =>
                        changePlan(activePlacement, event.target.value)
                      }
                      value={activePlanId}
                    >
                      {pricePlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} · {money(plan.price_cents)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="mt-3 text-sm">
                    {activeSessions[0]?.pricePlanName ||
                      activePlacement.pricePlanName}{" "}
                    ·{" "}
                    {money(
                      activeSessions[0]?.priceCents ??
                        activePlacement.priceCents,
                    )}{" "}
                    / session
                  </p>
                )}

                {activeClosureWarnings.length ? (
                  <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                    <p className="font-semibold">
                      Closure affecting {longDays[activePlacement.weekday]}
                    </p>
                    <p className="mt-1">
                      {activeClosureWarnings
                        .map(
                          (closure) =>
                            `${dateLabel(closure.date)} — ${closure.reason}`,
                        )
                        .join(" · ")}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-5 xl:grid-cols-[auto_1fr]">
                  <div className="overflow-x-auto">
                    <Calendar
                      disabled={(day) => {
                        const date = dateKey(day)
                        return (
                          day.getDay() !== activePlacement.weekday ||
                          Boolean(closureForDate(date, closures))
                        )
                      }}
                      mode="multiple"
                      modifiers={{
                        closure: (day) =>
                          Boolean(closureForDate(dateKey(day), closures)),
                        activeWeekday: (day) =>
                          day.getDay() === activePlacement.weekday &&
                          !closureForDate(dateKey(day), closures),
                      }}
                      modifiersClassNames={{
                        closure:
                          "bg-amber-100 text-amber-900 line-through opacity-70",
                        activeWeekday:
                          "ring-1 ring-inset ring-primary/30 data-[selected=true]:ring-0",
                      }}
                      onSelect={(dates) =>
                        updateRecurringDates(activePlacement, dates)
                      }
                      selected={activeSelectedDates}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg border bg-background p-3">
                      <p className="font-semibold">
                        {purpose === "plan"
                          ? "Add agreed first-period date for "
                          : "Add replacement for "}
                        {longDays[activePlacement.weekday]} ·{" "}
                        {activePlacement.startsAt.slice(0, 5)} · Table{" "}
                        {activePlacement.tableNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {purpose === "plan"
                          ? "This is a one-off date agreed before the child starts. It affects only the first paid period and does not change the recurring schedule."
                          : "Any replacement added here is automatically tied to this active recurring place. There is no separate table/day selector."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                          min={suggestionStart}
                          max={suggestionEnd}
                          onChange={(event) =>
                            setReplacementDateByLearner((current) => ({
                              ...current,
                              [group.key]: event.target.value,
                            }))
                          }
                          type="date"
                          value={
                            replacementDateByLearner[group.key] || ""
                          }
                        />
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
                            addReplacement(group.key, activePlacement)
                          }
                          type="button"
                          variant="outline"
                        >
                          {purpose === "plan" ? "Add agreed date" : "Add replacement"}
                        </Button>
                      </div>
                    </div>

                    {activeReplacementSessions.length ? (
                      <div>
                        <p className="text-sm font-semibold">
                          {days[activePlacement.weekday]} replacement dates
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {activeReplacementSessions.map((session) => (
                            <span
                              className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-950"
                              key={`${session.placementId}-${session.date}`}
                            >
                              {dateLabel(session.date)}
                              <button
                                aria-label={`Remove replacement ${dateLabel(session.date)}`}
                                className="rounded p-0.5 hover:bg-amber-100"
                                onClick={() => removeSession(session)}
                                type="button"
                              >
                                <X className="size-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {group.learnerName}&apos;s complete selected dates
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This table always retains every selected recurring day,
                      even while you switch the calendar between places.
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {learnerSessions.length} session
                    {learnerSessions.length === 1 ? "" : "s"}
                  </p>
                </div>

                {learnerSessions.length ? (
                  <div className="mt-2 overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Date</th>
                          <th className="px-3 py-2 font-medium">
                            Recurring place
                          </th>
                          <th className="px-3 py-2 font-medium">Type</th>
                          <th className="px-3 py-2 text-right font-medium">
                            Price
                          </th>
                          <th className="w-10 px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {learnerSessions.map((session) => {
                          const placement = group.placements.find(
                            (item) =>
                              item.placementId === session.placementId,
                          )
                          return (
                            <tr
                              className="border-t"
                              key={`${session.placementId}-${session.date}-${session.startsAt}`}
                            >
                              <td className="px-3 py-2 font-medium">
                                {dateLabel(session.date)}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {placement
                                  ? `${days[placement.weekday]} · `
                                  : ""}
                                Table {session.tableNumber} ·{" "}
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
                              <td className="px-2 py-2 text-right">
                                <button
                                  aria-label={`Remove ${dateLabel(session.date)}`}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  onClick={() => removeSession(session)}
                                  type="button"
                                >
                                  <X className="size-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No service dates selected.
                  </p>
                )}
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
