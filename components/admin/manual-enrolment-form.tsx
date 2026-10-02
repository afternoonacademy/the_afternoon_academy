"use client"

import { useActionState, useMemo, useState } from "react"
import { LoaderCircle } from "lucide-react"

import {
  recordExactManualEnrolment,
  type ExactManualEnrolmentState,
} from "@/actions/paid-period"
import { PaidPeriodBuilder } from "@/components/admin/paid-period-builder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AcademyClosure, PaidPeriodPlacement, PaidPeriodSession } from "@/lib/paid-period"

type Child = {
  id: string
  first_name: string | null
  child_age: number | null
}

type Slot = {
  id: string
  weekday: number
  table_number: number
  academy_table_id: string
  starts_at: string
  duration_minutes: number
  teacher_name: string | null
  focus: string | null
}

type PricePlan = { id: string; name: string; price_cents: number }

const initialState: ExactManualEnrolmentState = {}
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const iso = (date: Date) => date.toISOString().slice(0, 10)

export function ManualEnrolmentForm({
  parentLeadId,
  childOptions,
  slots,
  pricePlans,
  closures,
  fixedChild,
  plannedPlace,
}: {
  parentLeadId: string
  childOptions: Child[]
  slots: Slot[]
  pricePlans: PricePlan[]
  closures: AcademyClosure[]
  fixedChild?: Child
  plannedPlace?: {
    templateId: string
    pricePlanId: string
    seatNumber: number
    sessions: PaidPeriodSession[]
  }
}) {
  const today = iso(new Date())
  const suggestionEndDate = new Date()
  suggestionEndDate.setUTCDate(suggestionEndDate.getUTCDate() + 35)
  const suggestionEnd = iso(suggestionEndDate)

  const [state, formAction, pending] = useActionState(
    recordExactManualEnrolment,
    initialState,
  )
  const [childLeadId, setChildLeadId] = useState(fixedChild?.id || "")
  const [templateId, setTemplateId] = useState(plannedPlace?.templateId || "")
  const [pricePlanId, setPricePlanId] = useState(plannedPlace?.pricePlanId || "")

  const selectedChild = childOptions.find((child) => child.id === childLeadId)
  const selectedSlot = slots.find((slot) => slot.id === templateId)
  const selectedPlan = pricePlans.find((plan) => plan.id === pricePlanId)


  const builderPlacements = useMemo<PaidPeriodPlacement[]>(() => {
    if (!selectedChild || !selectedSlot || !selectedPlan) return []
    return [
      {
        placementId: selectedSlot.id,
        learnerId: null,
        learnerName: selectedChild.first_name || "Child",
        childLeadId: selectedChild.id,
        weekday: selectedSlot.weekday,
        academyTableId: selectedSlot.academy_table_id,
        tableNumber: selectedSlot.table_number,
        seatNumber: plannedPlace?.seatNumber ?? null,
        startsAt: selectedSlot.starts_at.slice(0, 5),
        durationMinutes: selectedSlot.duration_minutes,
        teacherName: selectedSlot.teacher_name,
        focus: selectedSlot.focus,
        pricePlanId: selectedPlan.id,
        pricePlanName: selectedPlan.name,
        priceCents: selectedPlan.price_cents,
      },
    ]
  }, [plannedPlace?.seatNumber, pricePlanId, selectedChild, selectedPlan, selectedSlot])

  return (
    <form action={formAction} className="space-y-5">
      <input name="parentLeadId" type="hidden" value={parentLeadId} />
      <input name="templateId" type="hidden" value={templateId} />
      <input name="pricePlanId" type="hidden" value={pricePlanId} />

      <p className="text-sm text-muted-foreground">
        Confirm this only after the bank transfer has cleared. The planned place
        already holds recurring capacity; this step records the payment and turns
        the reviewed exact dates into paid Operations places.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label>Child</Label>
          {fixedChild ? (
            <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium">
              {fixedChild.first_name || "Child"}
              {fixedChild.child_age ? ` · age ${fixedChild.child_age}` : ""}
            </div>
          ) : (
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              name="childLeadId"
              onChange={(event) => setChildLeadId(event.target.value)}
              required
              value={childLeadId}
            >
              <option value="">Choose child</option>
              {childOptions.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.first_name || "Child"}
                  {child.child_age ? ` · age ${child.child_age}` : ""}
                </option>
              ))}
            </select>
          )}
          {fixedChild ? <input name="childLeadId" type="hidden" value={fixedChild.id} /> : null}
        </div>

        {plannedPlace ? (
          <div className="sm:col-span-2">
            <Label>Planned recurring place</Label>
            <div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {selectedSlot
                ? `${days[selectedSlot.weekday]} · ${selectedSlot.starts_at.slice(0, 5)} · Table ${selectedSlot.table_number} · Capacity seat ${plannedPlace.seatNumber}`
                : "Planned place"}
              {selectedPlan
                ? ` · ${selectedPlan.name} · €${(selectedPlan.price_cents / 100).toFixed(2)} / session`
                : ""}
            </div>
          </div>
        ) : (
          <>
            <div>
              <Label>Recurring delivery place</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3"
                disabled={!childLeadId}
                onChange={(event) => setTemplateId(event.target.value)}
                required
                value={templateId}
              >
                <option value="">Choose table and time</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {days[slot.weekday]} · {slot.starts_at.slice(0, 5)} · Table{" "}
                    {slot.table_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Price plan</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3"
                onChange={(event) => setPricePlanId(event.target.value)}
                required
                value={pricePlanId}
              >
                <option value="">Choose price plan</option>
                {pricePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · €{(plan.price_cents / 100).toFixed(2)} per session
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <Label>Payment received on</Label>
          <Input name="receivedOn" defaultValue={today} required type="date" />
        </div>
      </div>

      <PaidPeriodBuilder
        key={`${childLeadId}:${templateId}:${pricePlanId}`}
        closures={closures}
        initialSessions={plannedPlace?.sessions || []}
        placements={builderPlacements}
        suggestionEnd={suggestionEnd}
        suggestionStart={today}
      />

      <label className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm">
        <input
          name="paymentReceived"
          required
          type="checkbox"
          value="yes"
        />
        I have checked that the payment has cleared and reviewed the exact paid dates.
      </label>

      <Button className="w-full" disabled={pending || !builderPlacements.length}>
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Confirming payment and activating dated places…
          </>
        ) : (
          "Confirm payment & activate paid dates"
        )}
      </Button>

      {state.error ? (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          className="rounded-md border border-emerald-400 bg-emerald-50 p-3 text-sm text-emerald-800"
          role="status"
        >
          {state.success}
        </p>
      ) : null}
    </form>
  )
}
