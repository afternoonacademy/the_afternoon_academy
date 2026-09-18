"use client"

import { useMemo, useState } from "react"
import { activateAcceptedBookingsPayment } from "@/actions/update-lead-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Booking = { childName: string; weekday: number; startsAt: string; tableNumber: number; seatNumber: number }
const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

function coveredDates(month: string, weekday: number) {
  if (!/^\d{4}-\d{2}$/.test(month)) return []
  const [year, monthNumber] = month.split("-").map(Number)
  const last = new Date(year, monthNumber, 0).getDate()
  return Array.from({length:last},(_,i)=>i+1).filter((day)=>new Date(year,monthNumber-1,day).getDay()===weekday)
}

export function PaymentActivationForm({ parentLeadId, bookings }: { parentLeadId: string; bookings: Booking[] }) {
  const today = new Date().toISOString().slice(0,10)
  const [month,setMonth] = useState(today.slice(0,7))
  const end = /^\d{4}-\d{2}$/.test(month) ? new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).toISOString().slice(0,10) : ""
  const summary = useMemo(()=>bookings.map((booking)=>({...booking, dates:coveredDates(month,booking.weekday)})),[bookings,month])
  return <form action={activateAcceptedBookingsPayment}>
    <input name="parentLeadId" type="hidden" value={parentLeadId}/><input name="periodStart" type="hidden" value={month ? month+"-01" : ""}/><input name="periodEnd" type="hidden" value={end}/>
    <p className="mb-2 text-sm text-muted-foreground">Choose the paid calendar month. The exact dates below come from each child’s accepted booking.</p>
    <div className="grid gap-2 sm:grid-cols-2"><div><Label>Payment received</Label><Input name="receivedOn" defaultValue={today} required type="date"/></div><div><Label>Paid calendar month</Label><Input value={month} onChange={(event)=>setMonth(event.target.value)} required type="month"/></div></div>
    <div className="mt-3 space-y-2">{summary.map((booking,index)=><div className="rounded-md bg-muted p-3 text-sm" key={index}><p className="font-medium">{booking.childName} · {dayNames[booking.weekday]} {booking.startsAt.slice(0,5)} · Table {booking.tableNumber}, Seat {booking.seatNumber}</p><p className="text-muted-foreground">Sessions: {booking.dates.length ? booking.dates.map((day)=>`${String(day).padStart(2,"0")}/${month.slice(5,7)}`).join(", ") : "Choose a month"}</p></div>)}</div>
    <Button className="mt-3 w-full">Confirm payment for {month || "selected month"}</Button>
  </form>
}