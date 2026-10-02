"use client"

import { useMemo, useState } from "react"
import { Mail, RotateCcw, Users } from "lucide-react"

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
  plannedBooking,
}: {
  parentLeadId: string
  child: Child
  pipelineStatus: string
  slots: Slot[]
  pricePlans: PricePlan[]
  closures: AcademyClosure[]
  seatCapacities: Record<string, number>
  seatHolds: RecurringSeatHold[]
  plannedBooking?: PlannedBooking | null
}) {
  const today = iso(new Date())
  const endDate = new Date()
  endDate.setUTCDate(endDate.getUTCDate() + 35)
  const suggestionEnd = iso(endDate)

  const [templateId, setTemplateId] = useState(
    plannedBooking?.weekly_table_template_id || "",
  )
  const [seatNumber, setSeatNumber] = useState(
    plannedBooking?.seat_number ? String(plannedBooking.seat_number) : "",
  )
  const [pricePlanId, setPricePlanId] = useState(
    plannedBooking?.session_price_plan_id || "",
  )
  const [editing, setEditing] = useState(!plannedBooking)

  const selectedSlot = slots.find((slot) => slot.id === templateId)
  const selectedPlan = pricePlans.find((plan) => plan.id === pricePlanId)
  const capacity = selectedSlot
    ? seatCapacities[selectedSlot.academy_table_id] || 0
    : 0

  const slotHolds = selectedSlot
    ? seatHolds.filter(
        (hold) =>
          hold.weekday === selectedSlot.weekday &&
          hold.academyTableId === selectedSlot.academy_table_id &&
          hold.startsAt.slice(0, 5) === selectedSlot.starts_at.slice(0, 5),
      )
    : []

  const seatHold = (seat: number) =>
    slotHolds.find((hold) => hold.seatNumber === seat)

  const builderPlacements = useMemo<PaidPeriodPlacement[]>(() => {
    if (!selectedSlot || !selectedPlan || !seatNumber) return []

    return [
      {
        placementId: selectedSlot.id,
        learnerId: null,
        learnerName: child.first_name || "Child",
        childLeadId: child.id,
        weekday: selectedSlot.weekday,
        academyTableId: selectedSlot.academy_table_id,
        tableNumber: selectedSlot.table_number,
        seatNumber: Number(seatNumber),
        startsAt: selectedSlot.starts_at.slice(0, 5),
        durationMinutes: selectedSlot.duration_minutes,
        teacherName: selectedSlot.teacher_name,
        focus: selectedSlot.focus,
        pricePlanId: selectedPlan.id,
        pricePlanName: selectedPlan.name,
        priceCents: selectedPlan.price_cents,
      },
    ]
  }, [child.first_name, child.id, seatNumber, selectedPlan, selectedSlot])

  const canEmail = pipelineStatus === "session_planned"
  const canConfirmPayment = pipelineStatus === "contacted"
  const isPaid = pipelineStatus === "paid"

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

        {plannedBooking && !isPaid ? (
          <div className="flex gap-2">
            <Button
              onClick={() => setEditing((value) => !value)}
              size="sm"
              type="button"
              variant="outline"
            >
              {editing ? "Hide planner" : "Edit planned place"}
            </Button>
            <SaveActionForm
              action={releasePlannedChildPlace}
              submitLabel="Release place"
              successMessage="Planned place released"
            >
              <input name="parentLeadId" type="hidden" value={parentLeadId} />
              <input name="childLeadId" type="hidden" value={child.id} />
            </SaveActionForm>
          </div>
        ) : null}
      </div>

      {plannedBooking && !editing ? (
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="font-semibold">Current planned place</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {days[plannedBooking.weekday]} ·{" "}
            {plannedBooking.starts_at.slice(0, 5)} · Table{" "}
            {plannedBooking.table_number} · Capacity seat{" "}
            {plannedBooking.seat_number}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedPlan?.name || "Price plan"} ·{" "}
            {selectedPlan ? money(selectedPlan.price_cents) + " / session" : ""}
          </p>
          {plannedBooking.planned_amount_cents !== null ? (
            <p className="mt-2 text-sm font-semibold">
              Planned total: {money(plannedBooking.planned_amount_cents)}
            </p>
          ) : null}
        </div>
      ) : null}

      {!isPaid && editing ? (
        <SaveActionForm
          action={recordPlannedChildPlace}
          submitLabel={plannedBooking ? "Update planned place" : "Record planned place"}
          successMessage="Session planned"
        >
          <input name="parentLeadId" type="hidden" value={parentLeadId} />
          <input name="childLeadId" type="hidden" value={child.id} />
          <input name="templateId" type="hidden" value={templateId} />
          <input name="seatNumber" type="hidden" value={seatNumber} />
          <input name="pricePlanId" type="hidden" value={pricePlanId} />

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Recurring table and time
              <select
                className="h-10 rounded-md border bg-background px-3 font-normal"
                onChange={(event) => {
                  setTemplateId(event.target.value)
                  setSeatNumber("")
                }}
                required
                value={templateId}
              >
                <option value="">Choose recurring place</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {days[slot.weekday]} · {slot.starts_at.slice(0, 5)} · Table{" "}
                    {slot.table_number}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium">
              Price plan
              <select
                className="h-10 rounded-md border bg-background px-3 font-normal"
                onChange={(event) => setPricePlanId(event.target.value)}
                required
                value={pricePlanId}
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
            <div className="rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="font-semibold">
                    Capacity seats · Table {selectedSlot.table_number} ·{" "}
                    {selectedSlot.starts_at.slice(0, 5)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Seat numbers are capacity markers, not fixed physical chairs.
                    Names show who is currently holding each recurring place.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: capacity }, (_, index) => index + 1).map(
                  (seat) => {
                    const hold = seatHold(seat)
                    const isOwn =
                      hold?.childLeadId === child.id ||
                      plannedBooking?.seat_number === seat
                    const unavailable = Boolean(hold && !isOwn)
                    const selected = Number(seatNumber) === seat

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
                        onClick={() => setSeatNumber(String(seat))}
                        type="button"
                      >
                        <span className="block font-semibold">Seat {seat}</span>
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
                  },
                )}
              </div>
            </div>
          ) : null}

          <PaidPeriodBuilder
            key={templateId + ":" + seatNumber + ":" + pricePlanId}
            closures={closures}
            initialSessions={
              plannedBooking?.planned_sessions &&
              plannedBooking.weekly_table_template_id === templateId &&
              plannedBooking.session_price_plan_id === pricePlanId &&
              String(plannedBooking.seat_number) === seatNumber
                ? plannedBooking.planned_sessions
                : []
            }
            placements={builderPlacements}
            suggestionEnd={plannedBooking?.planned_period_end || suggestionEnd}
            suggestionStart={plannedBooking?.planned_period_start || today}
          />
        </SaveActionForm>
      ) : null}

      {plannedBooking && canEmail ? (
        <div className="rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-semibold">Next step · contact parent</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The place is planned and capacity is held, but no payment or
                dated Operations attendance exists yet. Send the planned-place
                email when you are happy with the offer.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <SaveActionForm
              action={sendPlannedPlaceEmail}
              submitLabel="Email planned place to parent"
              successMessage="Parent contacted — awaiting payment"
            >
              <input name="parentLeadId" type="hidden" value={parentLeadId} />
              <input name="childLeadId" type="hidden" value={child.id} />
            </SaveActionForm>
          </div>
        </div>
      ) : null}

      {plannedBooking && canConfirmPayment ? (
        <div className="rounded-xl border p-4">
          <p className="font-semibold">Next step · confirm cleared payment</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the exact paid dates against the transfer, then confirm the
            payment. Only this step creates the paid entitlement and dated
            Operations places.
          </p>
          <div className="mt-4">
            <ManualEnrolmentForm
              childOptions={[child]}
              closures={closures}
              fixedChild={child}
              parentLeadId={parentLeadId}
              plannedPlace={{
                templateId: plannedBooking.weekly_table_template_id || "",
                pricePlanId: plannedBooking.session_price_plan_id || "",
                seatNumber: plannedBooking.seat_number,
                sessions: plannedBooking.planned_sessions || [],
              }}
              pricePlans={pricePlans}
              slots={slots}
            />
          </div>
        </div>
      ) : null}

      {isPaid ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          This child has a confirmed paid place. The exact paid dates are now
          represented in Operations.
        </div>
      ) : null}
    </div>
  )
}
