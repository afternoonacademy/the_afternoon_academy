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
  plannedPlaces,
}: {
  parentLeadId: string
  childOptions: Child[]
  slots: Slot[]
  pricePlans: PricePlan[]
  closures: AcademyClosure[]
  fixedChild?: Child
  plannedPlaces?: {
    templateId: string
    pricePlanId: string
    seatNumber: number
    sessions: PaidPeriodSession[]
  }[]
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
  const primaryPlannedPlace = plannedPlaces?.[0]
  const [templateId, setTemplateId] = useState(primaryPlannedPlace?.templateId || "")
  const [pricePlanId, setPricePlanId] = useState(primaryPlannedPlace?.pricePlanId || "")

  const selectedChild = childOptions.find((child) => child.id === childLeadId)
  const selectedSlot = slots.find((slot) => slot.id === templateId)
  const selectedPlan = pricePlans.find((plan) => plan.id === pricePlanId)


  const plannedSessions =
    plannedPlaces?.flatMap((place) => place.sessions) || []
  const plannedSessionTotal = plannedSessions.reduce(
    (sum, session) => sum + session.priceCents,
    0,
  )

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
        seatNumber: primaryPlannedPlace?.seatNumber ?? null,
        startsAt: selectedSlot.starts_at.slice(0, 5),
        durationMinutes: selectedSlot.duration_minutes,
        teacherName: selectedSlot.teacher_name,
        focus: selectedSlot.focus,
        pricePlanId: selectedPlan.id,
        pricePlanName: selectedPlan.name,
        priceCents: selectedPlan.price_cents,
      },
    ]
  }, [primaryPlannedPlace?.seatNumber, pricePlanId, selectedChild, selectedPlan, selectedSlot])

  if (plannedPlaces?.length && fixedChild) {
    const plannedRows = plannedPlaces
      .map((place) => {
        const slot = slots.find((item) => item.id === place.templateId)
        const plan = pricePlans.find((item) => item.id === place.pricePlanId)
        return slot && plan ? { place, slot, plan } : null
      })
      .filter(
        (
          row,
        ): row is {
          place: {
            templateId: string
            pricePlanId: string
            seatNumber: number
            sessions: PaidPeriodSession[]
          }
          slot: Slot
          plan: PricePlan
        } => Boolean(row),
      )

    return (
      <form action={formAction} className="space-y-4">
        <input name="parentLeadId" type="hidden" value={parentLeadId} />
        <input name="childLeadId" type="hidden" value={fixedChild.id} />
        <input
          name="selectedSessions"
          type="hidden"
          value={JSON.stringify(plannedSessions)}
        />

        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="text-lg font-semibold">
            {fixedChild.first_name || "Child"}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {plannedRows.map(({ place, slot, plan }) => (
              <div
                className="rounded-lg border bg-background p-3 text-sm"
                key={place.templateId}
              >
                <p className="font-semibold">
                  {days[slot.weekday]} · {slot.starts_at.slice(0, 5)} · Table{" "}
                  {slot.table_number}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Capacity seat {place.seatNumber} · {plan.name} · €
                  {(plan.price_cents / 100).toFixed(2)} / session
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-semibold">Planned paid dates</p>
            <div className="mt-2 overflow-hidden rounded-lg border bg-background">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Place</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {plannedSessions.map((session) => (
                    <tr
                      className="border-t"
                      key={
                        session.placementId +
                        ":" +
                        session.date +
                        ":" +
                        session.startsAt
                      }
                    >
                      <td className="px-3 py-2">
                        {new Intl.DateTimeFormat("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        }).format(new Date(session.date + "T12:00:00Z"))}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        Table {session.tableNumber} · {session.startsAt}
                        {session.replacement ? " · replacement" : ""}
                      </td>
                      <td className="px-3 py-2 text-right">
                        €{(session.priceCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 font-semibold">
              {plannedSessions.length} session
              {plannedSessions.length === 1 ? "" : "s"} · €
              {(plannedSessionTotal / 100).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="max-w-xs">
          <Label>Payment received on</Label>
          <Input name="receivedOn" defaultValue={today} required type="date" />
        </div>

        <label className="flex items-start gap-3 rounded-md border bg-background p-3 text-sm">
          <input
            className="mt-0.5"
            name="paymentReceived"
            required
            type="checkbox"
            value="yes"
          />
          <span>
            I confirm the payment has cleared for the planned amount and dates
            shown above.
          </span>
        </label>

        <Button className="w-full" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Confirming payment and activating dates…
            </>
          ) : (
            `Confirm payment & activate ${plannedSessions.length} date${plannedSessions.length === 1 ? "" : "s"}`
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

        {primaryPlannedPlace ? (
          <div className="sm:col-span-2">
            <Label>Planned recurring place</Label>
            <div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {selectedSlot
                ? `${days[selectedSlot.weekday]} · ${selectedSlot.starts_at.slice(0, 5)} · Table ${selectedSlot.table_number} · Capacity seat ${primaryPlannedPlace.seatNumber}`
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
        initialSessions={plannedSessions}
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
