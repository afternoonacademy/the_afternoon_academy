"use client"

import { useActionState, useMemo, useState } from "react"
import { recordManualEnrolment, type ManualEnrolmentActionState } from "@/actions/update-lead-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Child = { id: string; first_name: string | null; child_age: number | null }
type Slot = { id: string; weekday: number; table_number: number; starts_at: string }
const initialState: ManualEnrolmentActionState = {}
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function ManualEnrolmentForm({ parentLeadId, childOptions, slots }: { parentLeadId: string; childOptions: Child[]; slots: Slot[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const [state, formAction, pending] = useActionState(recordManualEnrolment, initialState)
  const [weekday, setWeekday] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const times = useMemo(() => [...new Set(slots.filter((slot) => String(slot.weekday) === weekday).map((slot) => slot.starts_at.slice(0, 5)))], [slots, weekday])
  const tableSlots = slots.filter((slot) => String(slot.weekday) === weekday && slot.starts_at.slice(0, 5) === startsAt)
  const templateId = tableSlots.find((slot) => String(slot.table_number) === tableNumber)?.id || ""

  return <form action={formAction} className="space-y-3">
    <input name="parentLeadId" type="hidden" value={parentLeadId} />
    <p className="text-sm text-muted-foreground">Use this only after you have personally agreed the place and checked the bank transfer. This creates the paid seat and dated sessions; it does not email the parent.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div><Label>Child</Label><select className="h-10 w-full rounded-md border bg-background px-3" name="childLeadId" required><option value="">Choose child</option>{childOptions.map((child) => <option key={child.id} value={child.id}>{child.first_name || "Child"}{child.child_age ? ` · age ${child.child_age}` : ""}</option>)}</select></div>
      <div><Label>Day</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={weekday} onChange={(event) => { setWeekday(event.target.value); setStartsAt(""); setTableNumber("") }} required><option value="">Choose day</option>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></div>
      <div><Label>Start time</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={startsAt} onChange={(event) => { setStartsAt(event.target.value); setTableNumber("") }} disabled={!weekday} required><option value="">Choose time</option>{times.map((time) => <option key={time} value={time}>{time}</option>)}</select></div>
      <div><Label>Table</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} disabled={!startsAt} required><option value="">Choose table</option>{tableSlots.map((slot) => <option key={slot.id} value={slot.table_number}>TAA1 Table {slot.table_number}</option>)}</select><input name="templateId" type="hidden" value={templateId} /></div>
      <div><Label>Seat</Label><select className="h-10 w-full rounded-md border bg-background px-3" name="seatNumber" required><option value="">Choose seat</option>{[1, 2, 3, 4, 5, 6].map((seat) => <option key={seat} value={seat}>Seat {seat}</option>)}</select></div>
      <div><Label>Payment received on</Label><Input name="receivedOn" defaultValue={today} required type="date" /></div>
      <div><Label>Seat start date</Label><Input name="periodStart" defaultValue={today} required type="date" /></div>
      <div><Label>Seat end date</Label><Input name="periodEnd" required type="date" /></div>
    </div>
    <label className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm"><input name="paymentReceived" required type="checkbox" value="yes" /> I have checked and recorded this payment manually.</label>
    <Button className={pending ? "brand-loading w-full" : "w-full"} disabled={pending}>{pending ? "Recording payment and seat…" : "Record payment and activate seat"}</Button>
    {state.error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{state.error}</p> : null}
    {state.success ? <p className="rounded-md border border-emerald-400 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{state.success}</p> : null}
  </form>
}
