"use client"

import { useActionState, useMemo, useState } from "react"

import { submitAcceptedPlace, type AcceptedPlaceActionState } from "@/actions/update-lead-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Child = { id: string; first_name: string | null; child_age: number }
type Slot = { id: string; weekday: number; table_number: number; starts_at: string; duration_minutes: number }

const initialState: AcceptedPlaceActionState = {}



export function AcceptedPlaceForm({ parentLeadId, childOptions, slots }: { parentLeadId: string; childOptions: Child[]; slots: Slot[] }) {
  const [state, formAction, pending] = useActionState(submitAcceptedPlace, initialState)
  const [weekday, setWeekday] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const times = useMemo(() => [...new Set(slots.filter((slot) => String(slot.weekday) === weekday).map((slot) => slot.starts_at.slice(0,5)))], [slots, weekday])
  const templateId = slots.find((slot) => String(slot.weekday) === weekday && slot.starts_at.slice(0,5) === startsAt && String(slot.table_number) === tableNumber)?.id || ""

  return <form action={formAction}>
    <input name="parentLeadId" type="hidden" value={parentLeadId}/>
    <p className="mb-2 text-sm text-muted-foreground">Record the room, table, seat and recurring time accepted for the next child.</p>
    <div className="grid gap-2 sm:grid-cols-3">
      <select className="h-10 rounded-md border bg-background px-3" name="childLeadId" required>
        <option value="">Child</option>
        {childOptions.map((child) => <option key={child.id} value={child.id}>{child.first_name || "Child"} · age {child.child_age}</option>)}
      </select>
      <select className="h-10 rounded-md border bg-background px-3" value={weekday} onChange={(event) => { setWeekday(event.target.value); setStartsAt(""); setTableNumber("") }} required>
        <option value="">Day</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option>
      </select>
      <select className="h-10 rounded-md border bg-background px-3" value={startsAt} onChange={(event) => { setStartsAt(event.target.value); setTableNumber("") }} disabled={!weekday} required>
        <option value="">Time</option>{times.map((time) => <option key={time} value={time}>{time}</option>)}
      </select>
      <select className="h-10 rounded-md border bg-background px-3" value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} disabled={!startsAt} required>
        <option value="">Table</option>{slots.filter((slot) => String(slot.weekday) === weekday && slot.starts_at.slice(0,5) === startsAt).map((slot) => <option key={slot.id} value={slot.table_number}>TAA1 Table {slot.table_number}</option>)}
      </select>
      <input name="templateId" type="hidden" value={templateId}/><select className="h-10 rounded-md border bg-background px-3" name="seatNumber" required>
        <option value="">Seat</option>{[1,2,3,4,5,6].map((seat) => <option key={seat} value={seat}>Seat {seat}</option>)}
      </select>
      <Input name="durationMinutes" defaultValue="50" min="15" required type="number"/>
      <Button className={pending ? "brand-loading sm:col-span-3" : "sm:col-span-3"} disabled={pending}>{pending ? "Checking seat…" : "Parent accepted — hold place"}</Button>
      {state.error ? <p className="sm:col-span-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.success ? <p className="sm:col-span-3 rounded-md border border-emerald-400 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{state.success}</p> : null}
    </div>
  </form>
}
