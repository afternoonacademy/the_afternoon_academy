"use client"

import { useState } from "react"

import { SessionChangeForm } from "@/components/admin/session-change-form"
import { Button } from "@/components/ui/button"

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

export function SessionChangeLauncher({
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
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} type="button" variant="outline">
        Change future sessions
      </Button>
    )
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Change future sessions</p>
          <p className="text-sm text-muted-foreground">
            Choose the destination session and rate before any financial preview appears.
          </p>
        </div>
        <Button onClick={() => setOpen(false)} type="button" variant="ghost">
          Cancel
        </Button>
      </div>
      <SessionChangeForm
        learnerId={learnerId}
        paidThrough={paidThrough}
        plans={plans}
        sessions={sessions}
        templates={templates}
      />
    </div>
  )
}
