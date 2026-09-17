import { createAcademySession, saveSessionPlacement } from "@/actions/learners"
import { PlacementActions } from "@/components/admin/placement-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabaseAdmin } from "@/lib/supabase/admin"

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

type Placement = {
  id: string
  session_id: string
  learner_id: string
  status: "proposed" | "offered" | "confirmed" | "waitlisted" | "ended"
  fit_note: string | null
}

export default async function SessionsPage() {
  const [sessionsResult, placementsResult, learnersResult] = await Promise.all([
    supabaseAdmin.from("academy_sessions").select("*").order("weekday").order("starts_at"),
    supabaseAdmin.from("session_placements").select("id, session_id, learner_id, status, fit_note"),
    supabaseAdmin.from("learners").select("id, first_name, year_group, status, parent_lead_id").neq("status", "left").order("first_name"),
  ])
  const sessions = sessionsResult.data || []
  const placements = (placementsResult.data || []) as Placement[]
  const learners = learnersResult.data || []
  const learnerById = new Map(learners.map((learner) => [learner.id, learner]))
  const placementCount = (sessionId: string, status: string) => placements.filter((item) => item.session_id === sessionId && item.status === status).length

  return <div className="space-y-8">
    <div><p className="text-sm text-muted-foreground">Human placement workflow</p><h2 className="text-3xl font-bold tracking-tight">Sessions and matching</h2><p className="mt-2 max-w-3xl text-muted-foreground">Staff first propose a considered match, then send a specific session offer. A place is only confirmed after the parent accepts; offers do not use capacity.</p></div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        {sessions.length ? sessions.map((session) => {
          const confirmed = placementCount(session.id, "confirmed")
          const waitlisted = placementCount(session.id, "waitlisted")
          const sessionPlacements = placements.filter((placement) => placement.session_id === session.id)
          return <Card key={session.id}><CardHeader><div className="flex flex-wrap justify-between gap-2"><div><CardTitle>{session.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground capitalize">{session.weekday} · {session.starts_at.slice(0, 5)} · {session.duration_minutes} min{session.room_name ? ` · ${session.room_name}` : ""}</p></div><p className="rounded-full border px-3 py-1 text-sm">{confirmed}/{session.capacity} confirmed</p></div></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{session.focus || "No focus recorded"}{session.age_range ? ` · ${session.age_range}` : ""}{session.teacher_name ? ` · ${session.teacher_name}` : ""}</p><p className="text-sm"><strong>{Math.max(session.capacity - confirmed, 0)} spaces remaining</strong>{waitlisted ? ` · ${waitlisted} waitlisted` : ""}</p>
            {sessionPlacements.length > 0 && <div className="space-y-2 rounded-md border p-3"><p className="text-sm font-medium">Current placement decisions</p>{sessionPlacements.map((placement) => { const learner = learnerById.get(placement.learner_id); if (!learner) return null; return <div key={placement.id} className="space-y-1 border-t pt-2 first:border-t-0 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{learner.first_name}{learner.year_group ? ` · ${learner.year_group}` : ""} <span className="font-normal capitalize text-muted-foreground">· {placement.status === "offered" ? "offer sent — awaiting reply" : placement.status}</span></p><PlacementActions placementId={placement.id} status={placement.status} hasParentLead={Boolean(learner.parent_lead_id)} /></div>{placement.fit_note && <p className="text-xs text-muted-foreground">Fit note: {placement.fit_note}</p>}</div> })}</div>}
            <form action={saveSessionPlacement} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2"><input type="hidden" name="sessionId" value={session.id}/><div className="space-y-1"><Label>Learner</Label><select name="learnerId" className="h-10 w-full rounded-md border bg-background px-3 text-sm" required><option value="">Choose learner</option>{learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.first_name}{learner.year_group ? ` · ${learner.year_group}` : ""}{learner.status === "paused" ? " · awaiting place" : ""}</option>)}</select></div><div className="space-y-1"><Label>Initial decision</Label><select name="status" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="proposed"><option value="proposed">Propose internally</option><option value="waitlisted">Waitlist</option><option value="ended">End placement</option></select></div><div className="space-y-1 sm:col-span-2"><Label>Why this is a fit (optional)</Label><Textarea name="fitNote" maxLength={1000} placeholder="Brief factual rationale: availability, learning focus, group fit or support need." /></div><Button type="submit" className="w-fit">Save decision</Button></form></CardContent></Card>
        }) : <Card><CardContent className="py-8 text-sm text-muted-foreground">Create the first session to begin matching.</CardContent></Card>}
      </div>
      <Card className="h-fit"><CardHeader><CardTitle>Create session</CardTitle></CardHeader><CardContent><form action={createAcademySession} className="space-y-3"><div className="space-y-1"><Label>Session name</Label><Input name="name" required maxLength={160} placeholder="Year 5 learning lab"/></div><div className="space-y-1"><Label>Focus</Label><Textarea name="focus" maxLength={500} placeholder="e.g. English confidence and study habits"/></div><div className="space-y-1"><Label>Age/year range</Label><Input name="ageRange" maxLength={80} placeholder="Years 5–6"/></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Day</Label><select name="weekday" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="monday">{days.map((day) => <option key={day} value={day} className="capitalize">{day}</option>)}</select></div><div className="space-y-1"><Label>Start</Label><Input name="startsAt" type="time" required/></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Minutes</Label><Input name="durationMinutes" type="number" min="15" max="360" defaultValue="60" required/></div><div className="space-y-1"><Label>Capacity</Label><Input name="capacity" type="number" min="1" max="40" defaultValue="6" required/></div></div><div className="space-y-1"><Label>Teacher</Label><Input name="teacherName" maxLength={160}/></div><div className="space-y-1"><Label>Room</Label><Input name="roomName" maxLength={100}/></div><div className="space-y-1"><Label>Status</Label><select name="status" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="planning"><option value="planning">Planning</option><option value="open">Open</option><option value="paused">Paused</option><option value="closed">Closed</option></select></div><Button type="submit">Create session</Button></form></CardContent></Card>
    </div>
  </div>
}
