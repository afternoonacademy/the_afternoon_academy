import { notFound } from "next/navigation"

import { createLearnerGoal, createTeacherUpdate, recordAttendance, updateLearnerDetails, updateLearnerGoalStatus } from "@/actions/learners"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type PageProps = { params: Promise<{ id: string }> }

function formatList(items: string[] | null | undefined) {
  return items?.length ? items.join(", ") : "Not recorded yet"
}

export default async function LearnerPage({ params }: PageProps) {
  const { id } = await params
  const [learnerResult, profileResult, attendanceResult, updatesResult, goalsResult] = await Promise.all([
    supabaseAdmin.from("learners").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("learner_profiles").select("*").eq("learner_id", id).maybeSingle(),
    supabaseAdmin.from("attendance_records").select("*").eq("learner_id", id).order("attendance_date", { ascending: false }),
    supabaseAdmin.from("teacher_updates").select("*").eq("learner_id", id).order("occurred_on", { ascending: false }),
    supabaseAdmin.from("learner_goals").select("*").eq("learner_id", id).order("created_at", { ascending: false }),
  ])

  if (!learnerResult.data) notFound()
  const learner = learnerResult.data
  const profile = profileResult.data
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Learner record · AI disabled</p>
          <h2 className="text-3xl font-bold tracking-tight">{learner.first_name}</h2>
          <p className="text-muted-foreground">{learner.year_group || "Year group not recorded"}</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-sm capitalize">{learner.status}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Learner details and lifecycle</CardTitle></CardHeader>
          <CardContent>
            <form action={updateLearnerDetails} className="space-y-4">
              <input type="hidden" name="learnerId" value={id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="learnerStatus">Learner status</Label><select id="learnerStatus" name="status" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue={learner.status}><option value="active">Active</option><option value="paused">Paused</option><option value="left">Left the academy</option></select></div>
                <div className="space-y-2"><Label htmlFor="currentSchoolName">Current school</Label><Input id="currentSchoolName" name="currentSchoolName" maxLength={160} defaultValue={learner.current_school_name || ""} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="teacherName">Teacher/contact name</Label><Input id="teacherName" name="teacherName" maxLength={160} defaultValue={learner.teacher_name || ""} /></div><div className="space-y-2"><Label htmlFor="teacherEmail">Teacher/contact email</Label><Input id="teacherEmail" name="teacherEmail" type="email" maxLength={254} defaultValue={learner.teacher_email || ""} /></div></div>
              <div className="space-y-2"><Label htmlFor="teacherPhone">Teacher/contact phone</Label><Input id="teacherPhone" name="teacherPhone" maxLength={50} defaultValue={learner.teacher_phone || ""} /></div>
              <label className="flex gap-3 rounded-md border p-3 text-sm"><input type="checkbox" name="schoolContactPermissionConfirmed" defaultChecked={learner.school_contact_permission_confirmed} /><span>I have confirmed it is appropriate to retain these school contact details for TAA&apos;s educational service.</span></label>
              <p className="text-xs text-muted-foreground">Only record a school contact where it is necessary for the child&apos;s support. Do not add sensitive information to contact fields.</p>
              <Button type="submit">Save learner details</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Learning profile</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><p className="font-medium">Strengths</p><p className="text-muted-foreground">{formatList(profile?.strengths)}</p></div>
            <div><p className="font-medium">Interests</p><p className="text-muted-foreground">{formatList(profile?.interests)}</p></div>
            <div><p className="font-medium">Current barriers</p><p className="text-muted-foreground">{formatList(profile?.barriers)}</p></div>
            <div><p className="font-medium">Parent priorities</p><p className="text-muted-foreground">{profile?.parent_priorities || "Not recorded yet"}</p></div>
            <div><p className="font-medium">What helps</p><p className="text-muted-foreground">{profile?.helpful_strategies || "Not recorded yet"}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick attendance</CardTitle></CardHeader>
          <CardContent>
            <form action={recordAttendance} className="space-y-4">
              <input type="hidden" name="learnerId" value={id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="attendanceDate">Date</Label><Input id="attendanceDate" name="attendanceDate" type="date" defaultValue={today} required /></div>
                <div className="space-y-2"><Label htmlFor="attendanceStatus">Status</Label><select id="attendanceStatus" name="status" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="present"><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="authorised_absence">Authorised absence</option></select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="attendanceNote">Optional note</Label><Input id="attendanceNote" name="note" maxLength={500} placeholder="Only if helpful for follow-up" /></div>
              <Button type="submit">Save attendance</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Observable goals</CardTitle></CardHeader>
          <CardContent>
            <form action={createLearnerGoal} className="space-y-4">
              <input type="hidden" name="learnerId" value={id} />
              <div className="space-y-2"><Label htmlFor="goalTitle">Small, observable goal</Label><Input id="goalTitle" name="title" maxLength={300} required placeholder="e.g. Start a task independently after one prompt" /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="goalDomain">Area</Label><select id="goalDomain" name="domain" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="academic"><option value="academic">Academic</option><option value="confidence">Confidence</option><option value="independence">Independence</option><option value="participation">Participation</option></select></div><div className="space-y-2"><Label htmlFor="targetDate">Review by</Label><Input id="targetDate" name="targetDate" type="date" /></div></div>
              <div className="space-y-2"><Label htmlFor="goalEvidence">Starting evidence (optional)</Label><Textarea id="goalEvidence" name="evidence" maxLength={2000} placeholder="A short factual baseline or context" /></div>
              <Button type="submit">Add goal</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Goal progress</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">{(goalsResult.data || []).length ? goalsResult.data?.map((goal) => <article key={goal.id} className="rounded-md border p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{goal.title}</p><p className="mt-1 text-muted-foreground capitalize">{goal.domain}{goal.target_date ? ` · review ${goal.target_date}` : ""}</p></div><form action={updateLearnerGoalStatus} className="flex gap-2"><input type="hidden" name="learnerId" value={id} /><input type="hidden" name="goalId" value={goal.id} /><select name="status" className="h-9 rounded-md border bg-background px-2 text-sm" defaultValue={goal.status}><option value="active">Active</option><option value="achieved">Achieved</option><option value="paused">Paused</option></select><Button size="sm" type="submit">Update</Button></form></div>{goal.evidence ? <p className="mt-2 text-muted-foreground">{goal.evidence}</p> : null}</article>) : <p className="text-muted-foreground">No goals recorded yet.</p>}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Teacher update</CardTitle></CardHeader>
        <CardContent>
          <form action={createTeacherUpdate} className="space-y-4">
            <input type="hidden" name="learnerId" value={id} />
            <div className="max-w-xs space-y-2"><Label htmlFor="occurredOn">Date</Label><Input id="occurredOn" name="occurredOn" type="date" defaultValue={today} required /></div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="whatHappened">What happened?</Label><Textarea id="whatHappened" name="whatHappened" required placeholder="A concise, factual observation" /></div>
              <div className="space-y-2"><Label htmlFor="whyItMattered">Why did it matter?</Label><Textarea id="whyItMattered" name="whyItMattered" required placeholder="The learning or confidence significance" /></div>
              <div className="space-y-2"><Label htmlFor="nextStep">Next small step</Label><Textarea id="nextStep" name="nextStep" required placeholder="What the team will try next" /></div>
            </div>
            <label className="flex gap-3 rounded-md border p-3 text-sm"><input type="checkbox" name="parentVisible" /><span>Mark as ready for parent review. It will not be automatically sent.</span></label>
            <p className="text-xs text-muted-foreground">Write only evidence-based observations. AI drafting is disabled and no information from this record is shared with an AI provider.</p>
            <Button type="submit">Save teacher update</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Full attendance history</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{(attendanceResult.data || []).length ? attendanceResult.data?.map((item) => <div key={item.id} className="border-b pb-3 last:border-0"><p className="font-medium capitalize">{item.attendance_date} · {item.status.replaceAll("_", " ")}</p>{item.note ? <p className="text-muted-foreground">{item.note}</p> : null}</div>) : <p className="text-muted-foreground">No attendance recorded yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Full teacher update history</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">{(updatesResult.data || []).length ? updatesResult.data?.map((item) => <article key={item.id} className="border-b pb-4 last:border-0"><p className="font-medium">{item.occurred_on}{item.parent_visible ? " · ready for parent review" : ""}</p><p className="mt-2"><span className="font-medium">What happened:</span> {item.what_happened}</p><p><span className="font-medium">Why it mattered:</span> {item.why_it_mattered}</p><p><span className="font-medium">Next step:</span> {item.next_step}</p></article>) : <p className="text-muted-foreground">No teacher updates yet.</p>}</CardContent></Card>
      </div>
    </div>
  )
}
