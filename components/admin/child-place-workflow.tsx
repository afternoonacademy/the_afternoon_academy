"use client"

import { useMemo, useState } from "react"
import { Mail, Plus, Trash2, Users } from "lucide-react"

import {
  recordPlannedChildPlace,
  releasePlannedChildPlace,
  sendPlannedPlaceEmail,
} from "@/actions/child-place-planning"
import { ManualEnrolmentForm } from "@/components/admin/manual-enrolment-form"
import { PaidPeriodBuilder } from "@/components/admin/paid-period-builder"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
  AcademyClosure,
  PaidPeriodPlacement,
  PaidPeriodSession,
} from "@/lib/paid-period"

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

type PricePlan = {
  id: string
  name: string
  price_cents: number
}

export type PlannedBooking = {
  id: string
  child_lead_id: string
  weekly_table_template_id: string | null
  session_price_plan_id: string | null
  weekday: number
  table_number: number
  academy_table_id: string
  seat_number: number
  starts_at: string
  duration_minutes: number
  status: string
  planned_sessions: PaidPeriodSession[]
  planned_amount_cents: number | null
  planned_period_start: string | null
  planned_period_end: string | null
}

export type RecurringSeatHold = {
  childLeadId: string
  childName: string
  weekday: number
  academyTableId: string
  startsAt: string
  seatNumber: number
  status: string
}

type PlaceSelection = {
  templateId: string
  seatNumber: string
  pricePlanId: string
}

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

const iso = (value: Date) => value.toISOString().slice(0, 10)

function statusLabel(status: string) {
  if (status === "new") return "Lead received"
  if (status === "session_planned") return "Session planned"
  if (status === "contacted") return "Contacted — awaiting payment"
  if (status === "paid") return "Paid"
  if (status === "waitlist") return "Waitlist"
  if (status === "closed") return "Closed"
  return status.replaceAll("_", " ")
}

export function ChildPlaceWorkflow({
  parentLeadId,
  child,
  pipelineStatus,
  slots,
  pricePlans,
  closures,
  seatCapacities,
  seatHolds,
  plannedBookings = [],
}: {
  parentLeadId: string
  child: Child
  pipelineStatus: string
  slots: Slot[]
  pricePlans: PricePlan[]
  closures: AcademyClosure[]
  seatCapacities: Record<string, number>
  seatHolds: RecurringSeatHold[]
  plannedBookings?: PlannedBooking[]
}) {
  const today = iso(new Date())
  const endDate = new Date()
  endDate.setUTCDate(endDate.getUTCDate() + 35)
  const suggestionEnd = iso(endDate)

  const initialSelections: PlaceSelection[] = plannedBookings.length
    ? plannedBookings.map((booking) => ({
        templateId: booking.weekly_table_template_id || "",
        seatNumber: String(booking.seat_number),
        pricePlanId: booking.session_price_plan_id || "",
      }))
    : [{ templateId: "", seatNumber: "", pricePlanId: "" }]

  const [placeSelections, setPlaceSelections] =
    useState<PlaceSelection[]>(initialSelections)
  const [editing, setEditing] = useState(!plannedBookings.length)

  const initialSessions = plannedBookings.flatMap(
    (booking) => booking.planned_sessions || [],
  )

  const builderPlacements = useMemo<PaidPeriodPlacement[]>(() => {
    return placeSelections.flatMap((selection) => {
      const slot = slots.find((item) => item.id === selection.templateId)
      const plan = pricePlans.find(
        (item) => item.id === selection.pricePlanId,
      )
      if (!slot || !plan || !selection.seatNumber) return []

      return [
        {
          placementId: slot.id,
          learnerId: null,
          learnerName: child.first_name || "Child",
          childLeadId: child.id,
          weekday: slot.weekday,
          academyTableId: slot.academy_table_id,
          tableNumber: slot.table_number,
          seatNumber: Number(selection.seatNumber),
          startsAt: slot.starts_at.slice(0, 5),
          durationMinutes: slot.duration_minutes,
          teacherName: slot.teacher_name,
          focus: slot.focus,
          pricePlanId: plan.id,
          pricePlanName: plan.name,
          priceCents: plan.price_cents,
        },
      ]
    })
  }, [child.first_name, child.id, placeSelections, pricePlans, slots])

  const canEmail = pipelineStatus === "session_planned"
  const canConfirmPayment = pipelineStatus === "contacted"
  const isPaid = pipelineStatus === "paid"

  function updateSelection(index: number, patch: Partial<PlaceSelection>) {
    setPlaceSelections((current) =>
      current.map((selection, itemIndex) =>
        itemIndex === index ? { ...selection, ...patch } : selection,
      ),
    )
  }

  function removeSelection(index: number) {
    setPlaceSelections((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const validSelections = placeSelections.filter(
    (selection) =>
      selection.templateId &&
      selection.seatNumber &&
      selection.pricePlanId,
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            Child pipeline status
          </p>
          <div className="mt-1">
            <Badge variant={isPaid ? "default" : "secondary"}>
              {statusLabel(pipelineStatus)}
            </Badge>
          </div>
        </div>

        {plannedBookings.length && !isPaid ? (
          <div className="flex gap-2">
            <Button
              onClick={() => setEditing((value) => !value)}
              size="sm"
              type="button"
              variant="outline"
            >
              {editing ? "Hide planner" : "Edit planned places"}
            </Button>
            <SaveActionForm
              action={releasePlannedChildPlace}
              submitLabel="Release places"
              successMessage="Planned places released"
            >
              <input name="parentLeadId" type="hidden" value={parentLeadId} />
              <input name="childLeadId" type="hidden" value={child.id} />
            </SaveActionForm>
          </div>
        ) : null}
      </div>

      {plannedBookings.length && !editing ? (
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="font-semibold">Current planned recurring places</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {plannedBookings.map((booking) => {
              const plan = pricePlans.find(
                (item) => item.id === booking.session_price_plan_id,
              )
              return (
                <div
                  className="rounded-lg border bg-background p-3 text-sm"
                  key={booking.id}
                >
                  <p className="font-semibold">
                    {days[booking.weekday]} ·{" "}
                    {booking.starts_at.slice(0, 5)} · Table{" "}
                    {booking.table_number}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Capacity seat {booking.seat_number}
                    {plan
                      ? ` · ${plan.name} · ${money(plan.price_cents)} / session`
                      : ""}
                  </p>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-sm font-semibold">
            Planned total:{" "}
            {money(
              initialSessions.reduce(
                (sum, session) => sum + session.priceCents,
                0,
              ),
            )}
          </p>
        </div>
      ) : null}

      {!isPaid && editing ? (
        <SaveActionForm
          action={recordPlannedChildPlace}
          onSuccess={() => setEditing(false)}
          submitLabel={
            plannedBookings.length
              ? "Update planned places"
              : "Record planned places"
          }
          successMessage="Sessions planned"
        >
          <input name="parentLeadId" type="hidden" value={parentLeadId} />
          <input name="childLeadId" type="hidden" value={child.id} />
          <input
            name="plannedPlaces"
            type="hidden"
            value={JSON.stringify(
              validSelections.map((selection) => ({
                templateId: selection.templateId,
                seatNumber: Number(selection.seatNumber),
                pricePlanId: selection.pricePlanId,
              })),
            )}
          />

          <div className="space-y-4">
            {placeSelections.map((selection, index) => {
              const selectedSlot = slots.find(
                (slot) => slot.id === selection.templateId,
              )
              const capacity = selectedSlot
                ? seatCapacities[selectedSlot.academy_table_id] || 0
                : 0
              const slotHolds = selectedSlot
                ? seatHolds.filter(
                    (hold) =>
                      hold.weekday === selectedSlot.weekday &&
                      hold.academyTableId ===
                        selectedSlot.academy_table_id &&
                      hold.startsAt.slice(0, 5) ===
                        selectedSlot.starts_at.slice(0, 5),
                  )
                : []
              const seatHold = (seat: number) =>
                slotHolds.find((hold) => hold.seatNumber === seat)

              return (
                <section
                  className="rounded-xl border bg-background p-4"
                  key={index}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        Recurring place {index + 1}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add one row for every day/time this child will normally
                        attend.
                      </p>
                    </div>
                    {placeSelections.length > 1 ? (
                      <Button
                        onClick={() => removeSelection(index)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <label className="grid gap-1 text-sm font-medium">
                      Recurring table and time
                      <select
                        className="h-10 rounded-md border bg-background px-3 font-normal"
                        onChange={(event) =>
                          updateSelection(index, {
                            templateId: event.target.value,
                            seatNumber: "",
                          })
                        }
                        required
                        value={selection.templateId}
                      >
                        <option value="">Choose recurring place</option>
                        {slots.map((slot) => {
                          const usedElsewhere = placeSelections.some(
                            (other, otherIndex) =>
                              otherIndex !== index &&
                              other.templateId === slot.id,
                          )
                          return (
                            <option
                              disabled={usedElsewhere}
                              key={slot.id}
                              value={slot.id}
                            >
                              {days[slot.weekday]} ·{" "}
                              {slot.starts_at.slice(0, 5)} · Table{" "}
                              {slot.table_number}
                            </option>
                          )
                        })}
                      </select>
                    </label>

                    <label className="grid gap-1 text-sm font-medium">
                      Price plan
                      <select
                        className="h-10 rounded-md border bg-background px-3 font-normal"
                        onChange={(event) =>
                          updateSelection(index, {
                            pricePlanId: event.target.value,
                          })
                        }
                        required
                        value={selection.pricePlanId}
                      >
                        <option value="">Choose price plan</option>
                        {pricePlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} · {money(plan.price_cents)} / session
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {selectedSlot ? (
                    <div className="mt-4 rounded-xl border p-4">
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 size-5 text-primary" />
                        <div>
                          <p className="font-semibold">
                            Capacity seats · Table{" "}
                            {selectedSlot.table_number} ·{" "}
                            {selectedSlot.starts_at.slice(0, 5)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Seat numbers are capacity markers, not fixed
                            physical chairs.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from(
                          { length: capacity },
                          (_, seatIndex) => seatIndex + 1,
                        ).map((seat) => {
                          const hold = seatHold(seat)
                          const ownBooking = plannedBookings.find(
                            (booking) =>
                              booking.weekly_table_template_id ===
                                selection.templateId &&
                              booking.seat_number === seat,
                          )
                          const isOwn =
                            hold?.childLeadId === child.id ||
                            Boolean(ownBooking)
                          const unavailable = Boolean(hold && !isOwn)
                          const selected =
                            Number(selection.seatNumber) === seat

                          return (
                            <button
                              className={
                                "rounded-lg border p-3 text-left text-sm transition " +
                                (selected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : unavailable
                                    ? "cursor-not-allowed bg-muted/50 text-muted-foreground"
                                    : "hover:bg-muted/40")
                              }
                              disabled={unavailable}
                              key={seat}
                              onClick={() =>
                                updateSelection(index, {
                                  seatNumber: String(seat),
                                })
                              }
                              type="button"
                            >
                              <span className="block font-semibold">
                                Seat {seat}
                              </span>
                              <span className="mt-1 block text-xs">
                                {hold
                                  ? hold.childName +
                                    " · " +
                                    statusLabel(
                                      hold.status === "paid_active"
                                        ? "paid"
                                        : hold.status,
                                    )
                                  : "Available"}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                </section>
              )
            })}

            <Button
              onClick={() =>
                setPlaceSelections((current) => [
                  ...current,
                  { templateId: "", seatNumber: "", pricePlanId: "" },
                ])
              }
              type="button"
              variant="outline"
            >
              <Plus className="size-4" />
              Add another recurring day
            </Button>
          </div>

          <PaidPeriodBuilder
            key={placeSelections
              .map(
                (selection) =>
                  selection.templateId +
                  ":" +
                  selection.seatNumber +
                  ":" +
                  selection.pricePlanId,
              )
              .join("|")}
            closures={closures}
            initialSessions={initialSessions}
            placements={builderPlacements}
            purpose="plan"
            suggestionEnd={
              plannedBookings
                .map((booking) => booking.planned_period_end)
                .filter(Boolean)
                .sort()
                .at(-1) || suggestionEnd
            }
            suggestionStart={
              plannedBookings
                .map((booking) => booking.planned_period_start)
                .filter(Boolean)
                .sort()[0] || today
            }
          />
        </SaveActionForm>
      ) : null}

      {plannedBookings.length && canEmail && !editing ? (
        <div className="rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-semibold">Next step · contact parent</p>
              <p className="mt-1 text-sm text-muted-foreground">
                All recurring days and the combined date list will be included
                in one planned-place email. No payment or dated Operations
                attendance exists yet.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <SaveActionForm
              action={sendPlannedPlaceEmail}
              submitLabel="Email planned places to parent"
              successMessage="Parent contacted — awaiting payment"
            >
              <input name="parentLeadId" type="hidden" value={parentLeadId} />
              <input name="childLeadId" type="hidden" value={child.id} />
            </SaveActionForm>
          </div>
        </div>
      ) : null}

      {plannedBookings.length && canConfirmPayment && !editing ? (
        <div className="rounded-xl border p-4">
          <p className="font-semibold">Next step · confirm cleared payment</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm the combined planned amount and dates. Only this step
            creates the paid entitlement and dated Operations places.
          </p>
          <div className="mt-4">
            <ManualEnrolmentForm
              childOptions={[child]}
              closures={closures}
              fixedChild={child}
              parentLeadId={parentLeadId}
              plannedPlaces={plannedBookings.map((booking) => ({
                templateId: booking.weekly_table_template_id || "",
                pricePlanId: booking.session_price_plan_id || "",
                seatNumber: booking.seat_number,
                sessions: booking.planned_sessions || [],
              }))}
              pricePlans={pricePlans}
              slots={slots}
            />
          </div>
        </div>
      ) : null}

      {isPaid ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          This child has confirmed paid places. The exact paid dates are now
          represented in Operations.
        </div>
      ) : null}
    </div>
  )
}
