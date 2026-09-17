import Link from "next/link"

import {
  createAcademySession,
  createTutorRoomBooking,
  recordAttendance,
  restoreSessionWeeklyDefault,
  saveLeadSessionOffer,
  saveSessionDateOverride,
} from "@/actions/learners"
import { LeadChildPicker } from "@/components/admin/lead-child-picker"
import { LeadOfferActions } from "@/components/admin/lead-offer-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabaseAdmin } from "@/lib/supabase/admin"

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
const dayLabel = (day: string) => day[0].toUpperCase() + day.slice(1)
const isoDate = (date: Date) => date.toISOString().slice(0, 10)
const dateWithOffset = (date: string, offset: number) => {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + offset)
  return isoDate(value)
}

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams
  const today = isoDate(new Date())
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date || "") ? params.date! : today
  const selectedDay = days[new Date(`${selectedDate}T12:00:00`).getDay()]

  const [sessionsR, placementsR, offersR, learnersR, profilesR, leadsR, childLeadsR, bookingsR, attendanceR, overridesR] = await Promise.all([
    supabaseAdmin.from("academy_sessions").select("id, name, focus, weekday, starts_at, duration_minutes, teacher_name, room_name, capacity, status, table_number").eq("room_name", "TAA1").neq("status", "closed").order("starts_at"),
    supabaseAdmin.from("session_placements").select("session_id, learner_id, status, seat_number"),
    supabaseAdmin.from("session_offers").select("id, session_id, parent_lead_id, learner_first_name, learner_year_group, seat_number, status, fit_note"),
    supabaseAdmin.from("learners").select("id, first_name, year_group").neq("status", "left").order("first_name"),
    supabaseAdmin.from("learner_profiles").select("learner_id, parent_priorities, helpful_strategies"),
    supabaseAdmin.from("parent_leads").select("id, parent_name, status").not("status", "in", '("converted","closed")').order("created_at", { ascending: false }),
    supabaseAdmin.from("child_leads").select("id, parent_lead_id, first_name, school_year").order("created_at"),
    supabaseAdmin.from("tutor_room_bookings").select("id, learner_id, parent_lead_id, teacher_name, starts_at, ends_at, note").order("starts_at").limit(20),
    supabaseAdmin.from("attendance_records").select("learner_id, session_id, status").eq("attendance_date", selectedDate),
    supabaseAdmin.from("session_date_overrides").select("session_id, teacher_name, focus, starts_at, duration_minutes").eq("service_date", selectedDate),
  ])

  const sessions = sessionsR.data || []
  const placements = placementsR.data || []
  const offers = offersR.data || []
  const learners = learnersR.data || []
  const profiles = profilesR.data || []
  const leads = leadsR.data || []
  const childLeads = childLeadsR.data || []
  const bookings = bookingsR.data || []
  const attendance = attendanceR.data || []
  const overrides = overridesR.data || []

  const learnerById = new Map(learners.map((learner) => [learner.id, learner]))
  const profileByLearnerId = new Map(profiles.map((profile) => [profile.learner_id, profile]))
  const leadName = new Map(leads.map((lead) => [lead.id, lead.parent_name]))
  const overrideBySession = new Map(overrides.map((override) => [override.session_id, override]))
  const teacherNames = [...new Set(sessions.map((session) => session.teacher_name).filter(Boolean))] as string[]
  const todaySessions = sessions.filter((session) => session.weekday === selectedDay && session.table_number)
  const attendanceBySeat = new Map(attendance.map((item) => [`${item.session_id}:${item.learner_id}`, item.status]))

  return <div className="space-y-6 pb-10">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">Daily delivery board</p><h2 className="text-3xl font-bold tracking-tight">TAA1 room plan</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Your normal weekly plan appears automatically. Changes here apply only to the selected date.</p></div>
      <form className="flex items-center gap-2" method="get"><Input aria-label="Choose date" className="w-40" defaultValue={selectedDate} name="date" type="date" /><Button size="sm">View day</Button></form>
    </div>

    <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-background" href={`/admin/sessions?date=${dateWithOffset(selectedDate, -1)}`}>← Previous</Link>
      <div className="text-center"><p className="font-semibold">{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${selectedDate}T12:00:00`))}</p><p className="text-xs text-muted-foreground">Tap a learner for useful context and attendance.</p></div>
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-background" href={`/admin/sessions?date=${dateWithOffset(selectedDate, 1)}`}>Next →</Link>
    </div>

    <datalist id="known-teachers">{teacherNames.map((teacher) => <option key={teacher} value={teacher} />)}</datalist>

    <section className="grid gap-4 lg:grid-cols-2">
      {[1, 2].map((tableNumber) => {
        const session = todaySessions.find((item) => item.table_number === tableNumber)
        const dateOverride = session ? overrideBySession.get(session.id) : undefined
        const teacher = dateOverride?.teacher_name ?? session?.teacher_name
        const focus = dateOverride?.focus ?? session?.focus
        const startsAt = dateOverride?.starts_at ?? session?.starts_at
        const duration = dateOverride?.duration_minutes ?? session?.duration_minutes
        const confirmed = session ? placements.filter((placement) => placement.session_id === session.id && placement.status === "confirmed") : []

        return <Card className="overflow-hidden" key={tableNumber}>
          <CardHeader className="border-b bg-primary/[0.03]">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TAA1</p><CardTitle>Table {tableNumber}</CardTitle></div><span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium">{confirmed.length}/6 filled</span></div>
            {session ? <div className="pt-2 text-sm"><p className="font-medium">{startsAt?.slice(0,5)} · {teacher || "Teacher to assign"}</p><p className="text-muted-foreground">{focus || "Session type to add"}{dateOverride ? " · changed for this date" : " · weekly default"}</p></div> : <p className="pt-2 text-sm text-muted-foreground">No weekly default is configured for this table on {dayLabel(selectedDay)}.</p>}
          </CardHeader>
          <CardContent className="space-y-4 p-3 sm:p-4">
            {session ? <form action={saveSessionDateOverride} className="grid gap-2 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
              <input name="sessionId" type="hidden" value={session.id} /><input name="serviceDate" type="hidden" value={selectedDate} />
              <div className="space-y-1"><Label htmlFor={`teacher-${session.id}`}>Teacher</Label><Input defaultValue={teacher || ""} id={`teacher-${session.id}`} list="known-teachers" name="teacherName" placeholder="Choose or type a teacher name" /></div>
              <div className="space-y-1"><Label htmlFor={`type-${session.id}`}>Session type</Label><Input defaultValue={focus || ""} id={`type-${session.id}`} name="focus" placeholder="e.g. General homework support" /></div>
              <div className="space-y-1"><Label htmlFor={`time-${session.id}`}>Timeslot</Label><Input defaultValue={startsAt?.slice(0,5)} id={`time-${session.id}`} name="startsAt" required type="time" /><p className="text-xs text-muted-foreground">The normal time is pre-filled; change only if this date differs.</p></div>
              <div className="space-y-1"><Label htmlFor={`duration-${session.id}`}>Duration (minutes)</Label><Input defaultValue={duration || 50} id={`duration-${session.id}`} max="360" min="15" name="durationMinutes" required type="number" /><p className="text-xs text-muted-foreground">How long this table runs on this date.</p></div>
              <div className="flex gap-2 sm:col-span-2"><Button className="min-h-10" size="sm">Save this date</Button>{dateOverride ? <Button className="min-h-10" formAction={restoreSessionWeeklyDefault} size="sm" type="submit" variant="outline">Restore weekly default</Button> : null}</div>
            </form> : null}
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }, (_, index) => {
                const seatNumber = index + 1
                const placement = confirmed.find((item) => item.seat_number === seatNumber) || confirmed.filter((item) => !item.seat_number)[index]
                const learner = placement ? learnerById.get(placement.learner_id) : undefined
                const profile = learner ? profileByLearnerId.get(learner.id) : undefined
                const attendanceStatus = placement && session ? attendanceBySeat.get(`${session.id}:${placement.learner_id}`) : undefined
                if (!session) return <div className="min-h-28 rounded-xl border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground" key={seatNumber}>Seat {seatNumber}<p className="mt-2 text-xs">Available once a weekly default exists.</p></div>
                if (!learner || !placement) return <div className="min-h-28 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100" key={seatNumber}><p className="text-xs font-semibold uppercase tracking-wider">Seat {seatNumber}</p><p className="mt-3 font-semibold">Available</p><p className="text-xs opacity-75">Ready to allocate</p></div>
                return <details className="min-h-28 rounded-xl border bg-background p-3 shadow-sm" key={seatNumber}><summary className="cursor-pointer list-none"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seat {seatNumber}</p><p className="mt-2 font-semibold">{learner.first_name}</p><p className="text-xs text-muted-foreground">{learner.year_group || "Year group to add"} · tap for details</p></summary><div className="mt-3 space-y-2 border-t pt-3 text-xs text-muted-foreground">{profile?.parent_priorities ? <p><span className="font-medium text-foreground">Parent priority:</span> {profile.parent_priorities}</p> : null}{profile?.helpful_strategies ? <p><span className="font-medium text-foreground">Helpful approach:</span> {profile.helpful_strategies}</p> : null}<form action={recordAttendance}><input name="learnerId" type="hidden" value={learner.id} /><input name="attendanceDate" type="hidden" value={selectedDate} /><input name="sessionId" type="hidden" value={session.id} /><input name="status" type="hidden" value="present" /><Button className="min-h-10 w-full" disabled={attendanceStatus === "present"} size="sm">{attendanceStatus === "present" ? "✓ Present" : "Mark present ✓"}</Button></form></div></details>
              })}
            </div>
          </CardContent>
        </Card>
      })}
    </section>

    <Card><CardHeader><CardTitle>Allocate a new TAA1 place</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Choose the parent, then their recorded child. Their name and year are taken from the enquiry automatically.</p><form action={saveLeadSessionOffer} className="grid gap-3 md:grid-cols-3"><select className="h-10 rounded-md border bg-background px-3" name="sessionId" required><option value="">Recurring table</option>{sessions.filter((session) => session.table_number).map((session) => <option key={session.id} value={session.id}>{dayLabel(session.weekday)} · Table {session.table_number} · {session.starts_at.slice(0,5)}</option>)}</select><select className="h-10 rounded-md border bg-background px-3" name="seatNumber" required><option value="">Seat number</option>{[1,2,3,4,5,6].map((seat) => <option key={seat} value={seat}>Seat {seat}</option>)}</select><LeadChildPicker children={childLeads} parents={leads} /><Textarea className="md:col-span-2" name="fitNote" placeholder="Optional practical note" /><Button className="min-h-11 w-full md:w-fit">Save proposed offer</Button></form>{offers.length ? <div className="mt-5 space-y-2">{offers.map((offer) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3" key={offer.id}><p className="text-sm"><strong>{offer.learner_first_name}</strong> · {leadName.get(offer.parent_lead_id)} · Seat {offer.seat_number || "to assign"} · <span className="capitalize">{offer.status}</span></p><LeadOfferActions offerId={offer.id} status={offer.status} /></div>)}</div> : null}</CardContent></Card>

    <Card><CardHeader><CardTitle>Tutor Room — one-to-one booking</CardTitle></CardHeader><CardContent><form action={createTutorRoomBooking} className="grid gap-3 sm:grid-cols-2"><div><Label>Existing learner</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" name="learnerId"><option value="">Choose a learner, if enrolled</option>{learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.first_name}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Use this for a confirmed learner.</p></div><div><Label>Or parent lead</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" name="parentLeadId"><option value="">Choose a lead, if not enrolled</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.parent_name}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Use this before a learner record exists.</p></div><div><Label>Teacher</Label><Input className="mt-1" list="known-teachers" name="teacherName" placeholder="Choose or type a teacher name" required /></div><div><Label>Start</Label><Input className="mt-1" name="startsAt" required type="datetime-local" /><p className="mt-1 text-xs text-muted-foreground">When the one-to-one begins.</p></div><div><Label>End</Label><Input className="mt-1" name="endsAt" required type="datetime-local" /><p className="mt-1 text-xs text-muted-foreground">When the one-to-one ends.</p></div><div><Label>Booking note</Label><Textarea className="mt-1" name="note" placeholder="Optional practical note" /></div><Button className="min-h-11 w-full sm:w-fit">Book Tutor Room</Button></form><div className="mt-5 space-y-2 text-sm">{bookings.length ? bookings.map((booking) => <p className="rounded border p-3" key={booking.id}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(booking.starts_at))} · {learnerById.get(booking.learner_id || "")?.first_name || leadName.get(booking.parent_lead_id || "") || "Booked"} · {booking.teacher_name}</p>) : <p className="text-muted-foreground">No Tutor Room bookings yet.</p>}</div></CardContent></Card>

    <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Admin: add a future weekly default</summary><p className="mb-4 mt-2 text-sm text-muted-foreground">Use this only when you are creating a new regular table/day. Day-to-day changes belong in the table cards above.</p><form action={createAcademySession} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input name="roomName" type="hidden" value="TAA1" /><input name="capacity" type="hidden" value="6" /><input name="status" type="hidden" value="open" /><select className="h-10 rounded-md border bg-background px-3" name="weekday">{days.map((day) => <option key={day} value={day}>{dayLabel(day)}</option>)}</select><select className="h-10 rounded-md border bg-background px-3" name="tableNumber"><option value="1">Table 1</option><option value="2">Table 2</option></select><Input defaultValue="17:00" name="startsAt" required type="time" /><Input defaultValue="50" max="360" min="15" name="durationMinutes" required type="number" /><Input defaultValue="General homework support" name="name" required placeholder="Session name" /><Input defaultValue="General homework support" name="focus" placeholder="Session type" /><Input list="known-teachers" name="teacherName" placeholder="Teacher" /><Button className="min-h-11 w-full lg:w-fit">Add weekly default</Button></form></details>
  </div>
}