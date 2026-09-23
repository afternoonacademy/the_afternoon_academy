"use client"

import { useMemo, useState, useTransition } from "react"
import { createAndSendPlaceOffer } from "@/actions/place-offers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Family = { id: string; parent_name: string; email: string }
type Child = { id: string; parent_lead_id: string; first_name: string | null; school_year: string | null }
type Slot = { id: string; weekday: number; table_number: number; academy_table_id: string; starts_at: string; duration_minutes: number }

const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

export function PlaceOfferForm({ families, children, slots }: { families: Family[]; children: Child[]; slots: Slot[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const [parentLeadId, setParentLeadId] = useState("")
  const [message, setMessage] = useState("")
  const [pending, startTransition] = useTransition()
  const familyChildren = useMemo(() => children.filter((child) => child.parent_lead_id === parentLeadId), [children, parentLeadId])

  return <form className="grid gap-4" action={(formData) => {
    setMessage("")
    startTransition(async () => {
      try {
        await createAndSendPlaceOffer(formData)
        setMessage("Offer sent. The seat is held until the stated expiry.")
        setParentLeadId("")
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not send the offer")
      }
    })
  }}>
    <div className="grid gap-4 md:grid-cols-2">
      <div><Label>Parent</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" name="parentLeadId" required value={parentLeadId} onChange={(event) => setParentLeadId(event.target.value)}><option value="">Choose parent</option>{families.map((family) => <option key={family.id} value={family.id}>{family.parent_name} · {family.email}</option>)}</select></div>
      <div><Label>Child</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" name="childLeadId" required disabled={!parentLeadId}><option value="">Choose child</option>{familyChildren.map((child) => <option key={child.id} value={child.id}>{child.first_name || "Child"}{child.school_year ? ` · ${child.school_year}` : ""}</option>)}</select></div>
      <div><Label>Recurring session</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" name="templateId" required><option value="">Choose a session</option>{slots.map((slot) => <option key={slot.id} value={slot.id}>{days[slot.weekday]} {slot.starts_at.slice(0,5)} · Table {slot.table_number} · {slot.duration_minutes} minutes</option>)}</select></div>
      <div><Label>Seat number</Label><Input className="mt-1" name="seatNumber" type="number" min="1" max="40" required /></div>
      <div><Label>Total to pay (€)</Label><Input className="mt-1" name="amountEuros" type="number" min="0.01" step="0.01" required /></div>
      <div><Label>Offer hold (hours)</Label><Input className="mt-1" name="expiryHours" type="number" min="1" max="168" defaultValue="48" required /></div>
      <div><Label>Service starts</Label><Input className="mt-1" name="periodStart" type="date" defaultValue={today} required /></div>
      <div><Label>Service ends</Label><Input className="mt-1" name="periodEnd" type="date" defaultValue={today} required /></div>
    </div>
    <p className="text-sm text-muted-foreground">The parent will receive the exact price, bank-transfer reference and a secure 48-hour offer link. Sending an offer does not activate a place.</p>
    <Button className={pending ? "brand-loading w-fit" : "w-fit"} disabled={pending}>{pending ? "Sending offer…" : "Send place offer"}</Button>
    {message ? <p className="rounded-md border p-3 text-sm" role="status">{message}</p> : null}
  </form>
}
