import { createAcademySession, saveSessionPlacement } from "@/actions/learners"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabaseAdmin } from "@/lib/supabase/admin"

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default async function SessionsPage() {
  const [sessionsResult, placementsResult, learnersResult] = await Promise.all([
    supabaseAdmin.from("academy_sessions").select("*").order("weekday").order("starts_at"),
    supabaseAdmin.from("session_placements").select("session_id, learner_id, status"),
    supabaseAdmin.from("learners").select("id, first_name, year_group").eq("status", "active").order("first_name"),
  ])
  const sessions = sessionsResult.data || []
  const placements = placementsResult.data || []
  const learners = learnersResult.data || []
  const placementCount = (sessionId: string, status: string) => placements.filter((item) => item.session_id === sessionId && item.status === status).length

  return <div className="space-y-8">
    <div><p className="text-sm text-muted-foreground">Human placement workflow</p><h2 className="text-3xl font-bold tracking-tight">Sessions and matching</h2><p className="mt-2 max-w-3xl text-muted-foreground">Create the real timetable first, then make a considered staff recommendation for each learner. A match is never automatic and a confirmed place cannot exceed capacity.</p></div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        {sessions.length ? sessions.map((session) => { const confirmed = placementCount(session.id, "confirmed"); const waitlisted = placementCount(session.id, "waitlisted"); return <Card key={session.id}><CardHeader><div className="flex flex-wrap justify-between gap-2"><div><CardTitle>{session.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground capitalize">{session.weekday} · {session.starts_at.slice(0, 5)} · {session.duration_minutes} min{session.room_name ? ` · ${session.room_name}` : ""}</p></div><p className="rounded-full border px-3 py-1 text-sm">{confirmed}/{session.capacity} confirmed</p></div></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{session.focus || "No focus recorded"}{session.age_range ? ` · ${session.age_range}` : ""}{session.teacher_name ? ` · ${session.teacher_name}` : ""}</p><p className="text-sm"><strong>{Math.max(session.capacity - confirmed, 0)} spaces remaining</strong>{waitlisted ? ` · ${waitlisted} waitlisted` : ""}</p><form action={saveSessionPlacement} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2"><input type="hidden" name="sessionId" value={session.id}/><div className="space-y-1"><Label>Learner</Label><select name="learnerId" className="h-10 w-full rounded-md border bg-background px-3 text-sm" required><option value="">Choose learner</option>{learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.first_name}{learner.year_group ? ` · ${learner.year_group}` : ""}</option>)}</select></div><div className="space-y-1"><Label>Staff decision</Label><select name="status" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="proposed"><option value="proposed">Proposed</option><option value="offered">Offered to parent</option><option value="confirmed">Confirmed place</option><option value="waitlisted">Waitlisted</option><option value="paused">Paused</option><option value="ended">Ended</option></select></div><div className="space-y-1 sm:col-span-2"><Label>Why this is a fit (optional)</Label><Textarea name="fitNote" maxLength={1000} placeholder="Brief factual rationale: availability, learning focus, group fit or support need." /></div><Button type="submit" className="w-fit">Save placement</Button></form></CardContent></Card> }) : <Card><CardContent className="py-8 text-sm text-muted-foreground">Create the first session to begin matching.</CardContent></Card>}
      </div>
      <Card className="h-fit"><CardHeader><CardTitle>Create session</CardTitle></CardHeader><CardContent><form action={createAcademySession} className="space-y-3"><div className="space-y-1"><Label>Session name</Label><Input name="name" required maxLength={160} placeholder="Year 5 learning lab"/></div><div className="space-y-1"><Label>Focus</Label><Textarea name="focus" maxLength={500} placeholder="e.g. English confidence and study habits"/></div><div className="space-y-1"><Label>Age/year range</Label><Input name="ageRange" maxLength={80} placeholder="Years 5–6"/></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Day</Label><select name="weekday" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="monday">{days.map((day) => <option key={day} value={day} className="capitalize">{day}</option>)}</select></div><div className="space-y-1"><Label>Start</Label><Input name="startsAt" type="time" required/></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Minutes</Label><Input name="durationMinutes" type="number" min="15" max="360" defaultValue="60" required/></div><div className="space-y-1"><Label>Capacity</Label><Input name="capacity" type="number" min="1" max="40" defaultValue="6" required/></div></div><div className="space-y-1"><Label>Teacher</Label><Input name="teacherName" maxLength={160}/></div><div className="space-y-1"><Label>Room</Label><Input name="roomName" maxLength={100}/></div><div className="space-y-1"><Label>Status</Label><select name="status" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="planning"><option value="planning">Planning</option><option value="open">Open</option><option value="paused">Paused</option><option value="closed">Closed</option></select></div><Button type="submit">Create session</Button></form></CardContent></Card>
    </div>
  </div>
}
