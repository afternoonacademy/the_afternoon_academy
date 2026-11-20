"use client"

import { useMemo, useState } from "react"

import { parseSessionPrice } from "@/lib/dated-session-pricing.mjs"
import { changeFutureSessions } from "@/actions/session-changes"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PaidSession = {
  placementId: string
  datedException: boolean
  date: string
  startsAt: string
  priceCents: number
  pricePlanName: string
}

type Template = {
  id: string
  weekday: number
  startsAt: string
  tableNumber: number
  focus: string
}

type Plan = {
  id: string
  name: string
  priceCents: number
}

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

function addDays(value: string, days: number) {
  const date = new Date(value + "T12:00:00Z")
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function nextDateForWeekday(start: string, weekday: number) {
  for (let cursor = start; ; cursor = addDays(cursor, 1)) {
    if (new Date(cursor + "T12:00:00Z").getUTCDay() === weekday) {
      return cursor
    }
  }
}

export function SessionChangeForm({
  learnerId,
  paidThrough,
  sessions,
  templates,
  plans,
}: {
  learnerId: string
  paidThrough: string
  sessions: PaidSession[]
  templates: Template[]
  plans: Plan[]
}) {
  const today = new Date().toISOString().slice(0, 10)
  const firstFuture = sessions.find((session) => session.date >= today)?.date || today
  const [scope, setScope] = useState<"from_date" | "single_session">("from_date")
  const [selectedSession, setSelectedSession] = useState(
    sessions.find((session) => session.date >= firstFuture && !session.datedException),
  )
  const effectiveDate = selectedSession?.date || firstFuture
  const [templateId, setTemplateId] = useState("")
  const [planId, setPlanId] = useState("")
  const [priceInput, setPriceInput] = useState("")
  const [pendingPlanId, setPendingPlanId] = useState("")
  const [replacementDate, setReplacementDate] = useState("")

  const template = templates.find((item) => item.id === templateId)
  const keepSlot = scope === "single_session" && templateId === "keep"
  const plan = plans.find((item) => item.id === planId)

  const priceCents = parseSessionPrice(priceInput)
  const pendingPlan = plans.find((item) => item.id === pendingPlanId)

  function selectService(next: Plan, keepPrice: boolean) {
    setPlanId(next.id)
    setPendingPlanId("")
    if (!keepPrice) setPriceInput((next.priceCents / 100).toFixed(2))
  }

  const preview = useMemo(() => {
    if ((!template && !keepSlot) || !plan || priceCents === null) return null
    if (scope === "single_session" && !keepSlot && !replacementDate) return null

    const oldSessions =
      scope === "single_session"
        ? sessions.filter((session) => session.date === effectiveDate && session.placementId === selectedSession?.placementId)
        : sessions.filter((session) => !session.datedException && session.date >= effectiveDate && session.placementId === selectedSession?.placementId)

    const dates: string[] = []
    if (scope === "single_session") {
      dates.push(keepSlot ? effectiveDate : replacementDate)
    } else if (template) {
      for (let cursor = effectiveDate; cursor <= paidThrough; cursor = addDays(cursor, 1)) {
        if (new Date(cursor + "T12:00:00Z").getUTCDay() === template.weekday) {
          dates.push(cursor)
        }
      }
    }

    const oldValue = oldSessions.reduce((sum, session) => sum + session.priceCents, 0)
    const newValue = dates.length * priceCents

    return {
      dates,
      oldSessions,
      oldValue,
      newValue,
      difference: newValue - oldValue,
    }
  }, [
    effectiveDate,
    keepSlot,
    paidThrough,
    plan,
    priceCents,
    replacementDate,
    scope,
    sessions,
    selectedSession,
    template,
  ])

  if (!plans.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Add an active timetable session and session rate before changing future
        sessions.
      </p>
    )
  }

  return (
    <SaveActionForm
      action={changeFutureSessions}
      submitLabel="Confirm future session change"
      successMessage="Future sessions changed"
    >
      <input name="effectiveDate" type="hidden" value={effectiveDate} />
      <input name="sourcePlacementId" type="hidden" value={selectedSession?.placementId || ""} />
      <input name="learnerId" type="hidden" value={learnerId} />
      <input name="templateId" type="hidden" value={templateId} />
      <input name="pricePlanId" type="hidden" value={pendingPlanId ? "" : planId} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="changeScope">Change</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="changeScope"
            name="scope"
            onChange={(event) => {
              const nextScope = event.target.value as "from_date" | "single_session"
              setScope(nextScope)
              if (nextScope === "from_date" && templateId === "keep") setTemplateId("")
              if (nextScope === "from_date" && selectedSession?.datedException) {
                setSelectedSession(sessions.find((session) => session.date >= today && !session.datedException))
              }
            }}
            value={scope}
          >
            <option value="from_date">Regular place from this date onward</option>
            <option value="single_session">This paid session only</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="effectiveDate">
            {scope === "single_session" ? "Paid session to change" : "Change from"}
          </Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="effectiveDate"
            onChange={(event) => {
              setSelectedSession(sessions.find((session) => `${session.date}:${session.placementId}` === event.target.value))
              setReplacementDate("")
            }}
            value={selectedSession ? `${selectedSession.date}:${selectedSession.placementId}` : ""}
          >
            {sessions
              .filter((session) => session.date >= today && (scope === "single_session" || !session.datedException))
              .map((session) => (
                <option key={session.date + session.placementId} value={`${session.date}:${session.placementId}`}>
                  {session.date} · {session.startsAt} · {session.pricePlanName}
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationSession">Date and time</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="destinationSession"
            onChange={(event) => {
              const nextId = event.target.value
              setTemplateId(nextId)
              setReplacementDate("")
            }}
            required
            value={templateId}
          >
            <option value="">Choose a destination session…</option>
            {scope === "single_session" ? <option value="keep">Keep this date and time</option> : null}
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][item.weekday]}
                {" · "}
                {item.startsAt.slice(0, 5)}
                {" · Table "}
                {item.tableNumber}
                {" · "}
                {item.focus}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationRate">Service</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="destinationRate"
            onChange={(event) => {
              const next = plans.find((item) => item.id === event.target.value)
              if (!next || next.id === planId) {
                setPendingPlanId("")
              } else if (plan && priceCents !== null && priceCents !== plan.priceCents) {
                setPendingPlanId(next.id)
              } else {
                selectService(next, false)
              }
            }}
            required
            value={pendingPlanId || planId}
          >
            <option value="">Choose a session rate…</option>
            {plans.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {money(item.priceCents)}/session
              </option>
            ))}
          </select>
        </div>

        {plan ? (
          <div className="space-y-2">
            <Label htmlFor="replacementPrice">Agreed session price (€)</Label>
            <Input aria-invalid={priceCents === null || Boolean(pendingPlan)} pattern={pendingPlan ? "(?!)" : "[0-9]{1,5}([.,][0-9]{1,2})?"} id="replacementPrice" inputMode="decimal" name="sessionPrice" onChange={(event) => setPriceInput(event.target.value)} required value={priceInput} />
            {pendingPlan && priceCents !== null ? (
              <div className="flex gap-3 text-sm">
                <button type="button" className="underline" onClick={() => selectService(pendingPlan, true)}>Keep {money(priceCents)}</button>
                <button type="button" className="underline" onClick={() => selectService(pendingPlan, false)}>Use {money(pendingPlan.priceCents)}</button>
              </div>
            ) : priceCents !== plan.priceCents ? (
              <button type="button" className="text-sm underline" onClick={() => selectService(plan, false)}>Reset to {money(plan.priceCents)}</button>
            ) : null}
          </div>
        ) : null}

        {scope === "single_session" && template ? (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="replacementDate">Replacement date</Label>
            <Input
              id="replacementDate"
              max={paidThrough}
              min={today}
              name="replacementDate"
              onChange={(event) => setReplacementDate(event.target.value)}
              required
              type="date"
              value={replacementDate}
            />
            <p className="text-xs text-muted-foreground">
              Choose a {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][template.weekday]} within the current paid period.
            </p>
          </div>
        ) : null}
      </div>

      {preview ? (
        <div className="rounded-xl border bg-muted/20 p-4 text-sm">
          <p className="font-semibold">Review before confirming</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="font-medium">Prepaid sessions being replaced</p>
              <p className="mt-1 text-muted-foreground">
                {preview.oldSessions.map((item) => item.date).join(", ") || "None"}
              </p>
              <p className="mt-1 font-semibold">{money(preview.oldValue)}</p>
            </div>
            <div>
              <p className="font-medium">New sessions</p>
              <p className="mt-1 text-muted-foreground">
                {preview.dates.join(", ") || "None"}
              </p>
              <p className="mt-1 font-semibold">{money(preview.newValue)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-md border bg-background p-3">
            {preview.difference < 0 ? (
              <p className="font-bold">
                Creates {money(Math.abs(preview.difference))} family credit
              </p>
            ) : preview.difference > 0 ? (
              <p className="font-bold">
                Creates {money(preview.difference)} additional family balance due
              </p>
            ) : (
              <p className="font-bold">No family balance adjustment</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              The balance is recorded at family level and is not automatically
              applied to this child or a sibling.
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No change is prepared yet. Choose a destination session and rate to see the dates and financial impact.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="changeReason">Reason / note</Label>
        <Input
          id="changeReason"
          maxLength={300}
          name="reason"
          placeholder="e.g. Parent requested move to group support"
        />
      </div>

      <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
        <input
          disabled={!preview}
          name="confirmChange"
          required
          type="checkbox"
          value="yes"
        />
        <span>
          I have reviewed the future dates, destination and family balance
          adjustment.
        </span>
      </label>
    </SaveActionForm>
  )
}
