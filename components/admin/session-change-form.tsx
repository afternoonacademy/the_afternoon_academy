"use client"

import { useMemo, useState } from "react"

import { changeFutureSessions } from "@/actions/session-changes"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PaidSession = {
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
  const [effectiveDate, setEffectiveDate] = useState(firstFuture)
  const [templateId, setTemplateId] = useState(templates[0]?.id || "")
  const [planId, setPlanId] = useState(plans[0]?.id || "")

  const template = templates.find((item) => item.id === templateId)
  const plan = plans.find((item) => item.id === planId)
  const defaultReplacementDate = template
    ? nextDateForWeekday(effectiveDate, template.weekday)
    : effectiveDate
  const [replacementDate, setReplacementDate] = useState(defaultReplacementDate)

  const preview = useMemo(() => {
    if (!template || !plan) return null

    const oldSessions =
      scope === "single_session"
        ? sessions.filter((session) => session.date === effectiveDate)
        : sessions.filter((session) => session.date >= effectiveDate)

    const dates: string[] = []
    if (scope === "single_session") {
      dates.push(replacementDate)
    } else {
      for (let cursor = effectiveDate; cursor <= paidThrough; cursor = addDays(cursor, 1)) {
        if (new Date(cursor + "T12:00:00Z").getUTCDay() === template.weekday) {
          dates.push(cursor)
        }
      }
    }

    const oldValue = oldSessions.reduce((sum, session) => sum + session.priceCents, 0)
    const newValue = dates.length * plan.priceCents

    return {
      dates,
      oldSessions,
      oldValue,
      newValue,
      difference: newValue - oldValue,
    }
  }, [
    effectiveDate,
    paidThrough,
    plan,
    replacementDate,
    scope,
    sessions,
    template,
  ])

  if (!templates.length || !plans.length) {
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
      <input name="learnerId" type="hidden" value={learnerId} />
      <input name="templateId" type="hidden" value={templateId} />
      <input name="pricePlanId" type="hidden" value={planId} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="changeScope">Change</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="changeScope"
            name="scope"
            onChange={(event) =>
              setScope(event.target.value as "from_date" | "single_session")
            }
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
            name="effectiveDate"
            onChange={(event) => {
              setEffectiveDate(event.target.value)
              if (template) {
                setReplacementDate(
                  nextDateForWeekday(event.target.value, template.weekday),
                )
              }
            }}
            value={effectiveDate}
          >
            {sessions
              .filter((session) => session.date >= today)
              .map((session) => (
                <option key={session.date + session.startsAt} value={session.date}>
                  {session.date} · {session.startsAt} · {session.pricePlanName}
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationSession">New session</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="destinationSession"
            onChange={(event) => {
              const nextId = event.target.value
              setTemplateId(nextId)
              const next = templates.find((item) => item.id === nextId)
              if (next) {
                setReplacementDate(
                  nextDateForWeekday(effectiveDate, next.weekday),
                )
              }
            }}
            value={templateId}
          >
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
          <Label htmlFor="destinationRate">Session rate</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="destinationRate"
            onChange={(event) => setPlanId(event.target.value)}
            value={planId}
          >
            {plans.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {money(item.priceCents)}/session
              </option>
            ))}
          </select>
        </div>

        {scope === "single_session" ? (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="replacementDate">Replacement date</Label>
            <Input
              id="replacementDate"
              max={paidThrough}
              min={today}
              name="replacementDate"
              onChange={(event) => setReplacementDate(event.target.value)}
              type="date"
              value={replacementDate}
            />
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
      ) : null}

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
        <input name="confirmChange" required type="checkbox" value="yes" />
        <span>
          I have reviewed the future dates, destination and family balance
          adjustment.
        </span>
      </label>
    </SaveActionForm>
  )
}
