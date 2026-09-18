"use client"

import { useActionState } from "react"

import { submitAcceptedPlace } from "@/actions/update-lead-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Child = { id: string; first_name: string | null; child_age: number }

const initialState = {}

export function AcceptedPlaceForm({ parentLeadId, children }: { parentLeadId: string; children: Child[] }) {
  const [state, formAction, pending] = useActionState(submitAcceptedPlace, initialState)

  return <form action={formAction}>
    <input name="parentLeadId" type="hidden" value={parentLeadId}/>
    <p className="mb-2 text-sm text-muted-foreground">Record the room, table, seat and recurring time accepted for the next child.</p>
    <div className="grid gap-2 sm:grid-cols-3">
      <select className="h-10 rounded-md border bg-background px-3" name="childLeadId" required>
        <option value="">Child</option>
        {children.map((child) => <option key={child.id} value={child.id}>{child.first_name || "Child"} · age {child.child_age}</option>)}
      </select>
      <select className="h-10 rounded-md border bg-background px-3" name="weekday" defaultValue="1">
        <option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option>
        <option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option>
      </select>
      <Input name="startsAt" defaultValue="17:00" required type="time"/>
      <select className="h-10 rounded-md border bg-background px-3" name="tableNumber" defaultValue="1">
        <option value="1">TAA1 · Table 1</option><option value="2">TAA1 · Table 2</option>
      </select>
      <select className="h-10 rounded-md border bg-background px-3" name="seatNumber" required>
        <option value="">Seat</option>{[1,2,3,4,5,6].map((seat) => <option key={seat} value={seat}>Seat {seat}</option>)}
      </select>
      <Input name="durationMinutes" defaultValue="50" min="15" required type="number"/>
      <Button className="sm:col-span-3" disabled={pending}>{pending ? "Checking seat…" : "Parent accepted — hold place"}</Button>
      {state.error ? <p className="sm:col-span-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.success ? <p className="sm:col-span-3 rounded-md border border-emerald-400 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{state.success}</p> : null}
    </div>
  </form>
}