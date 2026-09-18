"use client"

import { useActionState } from "react"

import { submitAcceptedPlace, type AcceptedPlaceActionState } from "@/actions/update-lead-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Child = { id: string; first_name: string | null; child_age: number }
type Slot = { id: string; weekday: number; table_number: number; starts_at: string; duration_minutes: number }

const initialState: AcceptedPlaceActionState = {}

function slotLabel(slot: Slot) {
  const [hour, minute] = slot.starts_at.slice(0,5).split(":").map(Number)
  const end = hour * 60 + minute + slot.duration_minutes
  const endText = `${String(Math.floor(end / 60) % 24).padStart(2,"0")}:${String(end % 60).padStart(2,"0")}`
  return `${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][slot.weekday]} · ${slot.starts_at.slice(0,5)}–${endText} · TAA1 Table ${slot.table_number}`
}

export function AcceptedPlaceForm({ parentLeadId, children, slots }: { parentLeadId: string; children: Child[]; slots: Slot[] }) {
  const [state, formAction, pending] = useActionState(submitAcceptedPlace, initialState)

  return <form action={formAction}>
    <input name="parentLeadId" type="hidden" value={parentLeadId}/>
    <p className="mb-2 text-sm text-muted-foreground">Record the room, table, seat and recurring time accepted for the next child.</p>
    <div className="grid gap-2 sm:grid-cols-3">
      <select className="h-10 rounded-md border bg-background px-3" name="childLeadId" required>
        <option value="">Child</option>
        {children.map((child) => <option key={child.id} value={child.id}>{child.first_name || "Child"} · age {child.child_age}</option>)}
      </select>
      <select className="h-10 rounded-md border bg-background px-3 sm:col-span-2" name="templateId" required>
        <option value="">Bookable timetable slot</option>
        {slots.map((slot) => <option key={slot.id} value={slot.id}>{slotLabel(slot)}</option>)}
      </select><select className="h-10 rounded-md border bg-background px-3" name="seatNumber" required>
        <option value="">Seat</option>{[1,2,3,4,5,6].map((seat) => <option key={seat} value={seat}>Seat {seat}</option>)}
      </select>
      <Input name="durationMinutes" defaultValue="50" min="15" required type="number"/>
      <Button className="sm:col-span-3" disabled={pending}>{pending ? "Checking seat…" : "Parent accepted — hold place"}</Button>
      {state.error ? <p className="sm:col-span-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.success ? <p className="sm:col-span-3 rounded-md border border-emerald-400 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{state.success}</p> : null}
    </div>
  </form>
}