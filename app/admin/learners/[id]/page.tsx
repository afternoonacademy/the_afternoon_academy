import Link from "next/link"
import { notFound } from "next/navigation"

import {
  createLearnerGoal,
  recordAttendance,
  recordLearnerGoalProgress,
} from "@/actions/learners"
import { FamilyCommunications } from "@/components/admin/family-communications"
import { TeacherSessionNote } from "@/components/admin/teacher-session-note"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { roleHasCapability } from "@/lib/auth/capabilities.mjs"
import { requireCapability } from "@/lib/auth/require-capability"
import { supabaseAdmin } from "@/lib/supabase/admin"

type PageProps = { params: Promise<{ id: string }> }

function formatList(items: string[] | null | undefined) {
  return items?.length ? items.join(", ") : "Not recorded yet"
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

export default async function LearnerPage({ params }: PageProps) {
  const { internalUser } = await requireCapability("view_learners")
  const canViewCommercial = roleHasCapability(internalUser.role, "view_family_pipeline")
  const canManageLifecycle = roleHasCapability(internalUser.role, "destructive_admin_actions")
  const canEditLearning = roleHasCapability(internalUser.role, "edit_learning_record")
  const { id } = await params
  const today = new Date().toISOString().slice(0, 10)

  const [
    learnerResult,
    profileResult,
    attendanceResult,
    updatesResult,
    goalsResult,
    goalProgressResult,
    assignmentsResult,
  ] = await Promise.all([
    supabaseAdmin.from("learners").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("learner_profiles").select("*").eq("learner_id", id).maybeSingle(),
    supabaseAdmin
      .from("attendance_records")
      .select("*, delivery_sessions(focus, starts_at, teacher_name)")
      .eq("learner_id", id)
      .order("attendance_date", { ascending: false }),
    supabaseAdmin
      .from("teacher_updates")
      .select("*,teaching_frameworks(title)")
      .eq("learner_id", id)
      .order("occurred_on", { ascending: false }),
    supabaseAdmin
      .from("learner_goals")
      .select("*")
      .eq("learner_id", id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("learner_goal_progress")
      .select("goal_id,progress_state,occurred_on,created_at")
      .eq("learner_id", id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("learner_teaching_frameworks")
      .select("*,teaching_frameworks(title),teaching_framework_versions(id,prompt_config)")
      .eq("learner_id", id)
      .order("starts_on", { ascending: false }),
  ])

  if (!learnerResult.data) notFound()
  const learner = learnerResult.data
  const profile = profileResult.data
  const updates = updatesResult.data || []
  const goals = goalsResult.data || []
  const goalProgress = goalProgressResult.data || []
  const assignments = assignmentsResult.data || []

  const activeAssignments = assignments.filter(
    (item) =>
      item.status === "active" &&
      item.starts_on <= today &&
      (!item.ends_on || item.ends_on >= today),
  )

  const sessionAssignments = activeAssignments.map((item) => ({
    id: item.id,
    is_default: item.is_default,
    framework: {
      title: relationOne(item.teaching_frameworks)?.title || "Teaching framework",
    },
    version: {
      id: relationOne(item.teaching_framework_versions)?.id || item.framework_version_id,
      prompt_config: Array.isArray(relationOne(item.teaching_framework_versions)?.prompt_config)
        ? relationOne(item.teaching_framework_versions)?.prompt_config
        : [],
    },
  }))

  const latestUpdate = updates[0] || null
  const activeGoals = goals.filter((goal) => goal.status === "active")

  const [standingResult, entitlementResult, renewalResult, communicationsResult] =
    canViewCommercial
      ? await Promise.all([
          supabaseAdmin
            .from("standing_placements")
            .select("id,weekday,table_number,seat_number,starts_at,status,effective_from,effective_to,session_price_plans(name,price_cents)")
            .eq("learner_id", id)
            .eq("status", "active")
            .order("weekday")
            .order("starts_at"),
          supabaseAdmin
            .from("child_payment_entitlements")
            .select("period_start,period_end,status,selected_sessions,created_at")
            .eq("learner_id", id)
            .eq("status", "paid")
            .order("period_end", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("renewal_cases")
            .select("status,due_on,selected_sessions,email_sent_at")
            .eq("learner_id", id)
            .in("status", ["ready_to_send", "awaiting_payment", "overdue"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("email_delivery_log")
            .select("id,parent_lead_id,child_lead_id,learner_id,renewal_case_id,email_kind,recipient_email,status,subject,body_text,sent_at,delivered_at,bounced_at,failed_at,delivery_detail,error_message,created_at,child_leads(first_name),learners(first_name)")
            .eq("parent_lead_id", learner.parent_lead_id)
            .order("created_at", { ascending: false }),
        ])
      : [{ data: [] }, { data: null }, { data: null }, { data: [] }]

  const activePlaces = standingResult.data || []
  const latestEntitlement = entitlementResult.data
  const renewal = renewalResult.data
  const communications = communicationsResult.data || []
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const paymentStatus =
    renewal?.status === "awaiting_payment"
      ? "Payment pending"
      : renewal?.status === "ready_to_send" || renewal?.status === "overdue"
        ? "Renewal due"
        : latestEntitlement?.period_end && latestEntitlement.period_end >= today
          ? "Paid"
          : activePlaces.length
            ? "Renewal due"
            : "No active place"

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value + "T12:00:00Z"))

  const paidDates = Array.isArray(latestEntitlement?.selected_sessions)
    ? [...new Set(
        latestEntitlement.selected_sessions
          .map((session) => {
            if (!session || typeof session !== "object" || Array.isArray(session)) return null
            const date = (session as Record<string, unknown>).date
            return typeof date === "string" ? date : null
          })
          .filter((date): date is string => Boolean(date)),
      )].sort()
    : []

  return (
    <div className="space-y-6 pb-10">
      <header className="brand-hero p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="brand-kicker">Learner workspace</p>
            <h2 className="mt-2 text-3xl font-bold">{learner.first_name}</h2>
            <p className="mt-1 text-muted-foreground">
              {learner.year_group ? `Year ${String(learner.year_group).replace(/^Year\s*/i, "")}` : "Year group not recorded"}
              {learner.current_school_name ? ` · ${learner.current_school_name}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="capitalize" variant={learner.status === "active" ? "default" : "secondary"}>
                {learner.status}
              </Badge>
              {activeAssignments.map((assignment) => {
                const framework = relationOne(assignment.teaching_frameworks)
                return (
                  <Badge key={assignment.id} variant="outline">
                    {framework?.title || "Teaching framework"}
                    {assignment.is_default ? " · default" : ""}
                  </Badge>
                )
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEditLearning ? (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href={"/admin/learners/" + id + "/edit"}>Edit learner</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={"/admin/learners/" + id + "/teaching-context"}>Manage teaching context</Link>
                </Button>
              </>
            ) : null}
            {canManageLifecycle ? (
              <Button asChild size="sm" variant="outline">
                <Link href={"/admin/learners/" + id + "/status"}>Change status</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <Tabs defaultValue="workspace">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0" variant="line">
          <TabsTrigger className="min-w-fit px-4 py-3" value="workspace">Workspace</TabsTrigger>
          <TabsTrigger className="min-w-fit px-4 py-3" value="attendance">Attendance</TabsTrigger>
          <TabsTrigger className="min-w-fit px-4 py-3" value="history">Teaching history</TabsTrigger>
          {canViewCommercial ? <TabsTrigger className="min-w-fit px-4 py-3" value="family">Family & place</TabsTrigger> : null}
          {canViewCommercial ? <TabsTrigger className="min-w-fit px-4 py-3" value="communications">Communications</TabsTrigger> : null}
        </TabsList>

        <TabsContent className="space-y-5 pt-4" value="workspace">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>What are we helping with?</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {activeAssignments.length ? activeAssignments.map((assignment) => {
                  const framework = relationOne(assignment.teaching_frameworks)
                  return (
                    <div className="rounded-lg border p-3" key={assignment.id}>
                      <p className="font-semibold">{framework?.title || "Teaching framework"}</p>
                      {assignment.curriculum_course ? <p className="mt-1 text-muted-foreground">{assignment.curriculum_course}</p> : null}
                      {assignment.exam_board ? <p className="text-muted-foreground">{assignment.exam_board}</p> : null}
                      {assignment.current_unit_topic ? <p className="mt-1">Current focus: {assignment.current_unit_topic}</p> : null}
                      {assignment.learner_objectives ? <p className="mt-1 text-muted-foreground">{assignment.learner_objectives}</p> : null}
                    </div>
                  )
                }) : (
                  <div>
                    <p className="text-muted-foreground">No teaching framework assigned yet.</p>
                    {canEditLearning ? (
                      <Link className="mt-2 inline-block font-semibold text-primary hover:underline" href={"/admin/learners/" + id + "/teaching-context"}>
                        Add teaching context
                      </Link>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Last time</CardTitle></CardHeader>
              <CardContent className="text-sm">
                {latestUpdate ? (
                  <div className="space-y-2">
                    <p className="font-medium">{formatDate(latestUpdate.occurred_on)}</p>
                    {latestUpdate.note_format === "contextual" ? (
                      <>
                        <p><span className="font-medium">Worked on:</span> {latestUpdate.working_on}</p>
                        <p><span className="font-medium">Reached:</span> {latestUpdate.reached}</p>
                        <p><span className="font-medium">Pick up next:</span> {latestUpdate.next_step}</p>
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium">What happened:</span> {latestUpdate.what_happened}</p>
                        <p><span className="font-medium">Next step:</span> {latestUpdate.next_step}</p>
                      </>
                    )}
                  </div>
                ) : <p className="text-muted-foreground">No teaching notes yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>What helps</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Strengths</p>
                  <p className="text-muted-foreground">{formatList(profile?.strengths)}</p>
                </div>
                <div>
                  <p className="font-medium">Current barriers</p>
                  <p className="text-muted-foreground">{formatList(profile?.barriers)}</p>
                </div>
                <div>
                  <p className="font-medium">Helpful strategies</p>
                  <p className="text-muted-foreground">{profile?.helpful_strategies || "Not recorded yet"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Active goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeGoals.length ? activeGoals.map((goal) => (
                  <article className="rounded-lg border p-3 text-sm" key={goal.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{goal.title}</p>
                        <p className="mt-1 capitalize text-muted-foreground">
                          {goal.domain}{goal.target_date ? ` · review ${formatDate(goal.target_date)}` : ""}
                        </p>
                        {goal.evidence ? <p className="mt-2 text-muted-foreground">{goal.evidence}</p> : null}
                      </div>
                      <div className="min-w-full sm:min-w-0">
                        {goalProgress.find((item) => item.goal_id === goal.id) ? (
                          <p className="mb-2 text-right text-xs text-muted-foreground">
                            Latest: {goalProgress.find((item) => item.goal_id === goal.id)?.progress_state.replaceAll("_", " ")}
                          </p>
                        ) : null}
                        <form action={recordLearnerGoalProgress} className="flex flex-wrap justify-end gap-2">
                          <input name="learnerId" type="hidden" value={id} />
                          <input name="goalId" type="hidden" value={goal.id} />
                          <input name="occurredOn" type="hidden" value={today} />
                          <Button name="progressState" size="sm" type="submit" value="no_change" variant="ghost">No change</Button>
                          <Button name="progressState" size="sm" type="submit" value="progressing" variant="outline">Progressing</Button>
                          <Button name="progressState" size="sm" type="submit" value="needs_review" variant="outline">Needs review</Button>
                          <Button name="progressState" size="sm" type="submit" value="achieved">Achieved</Button>
                        </form>
                      </div>
                    </div>
                  </article>
                )) : <p className="text-sm text-muted-foreground">No active goals yet.</p>}

                {canEditLearning ? (
                  <details className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-semibold">Add a small observable goal</summary>
                    <form action={createLearnerGoal} className="mt-4 space-y-3">
                      <input name="learnerId" type="hidden" value={id} />
                      <Input maxLength={300} name="title" placeholder="e.g. Explain fraction method independently" required />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue="academic" name="domain">
                          <option value="academic">Academic</option>
                          <option value="confidence">Confidence</option>
                          <option value="independence">Independence</option>
                          <option value="participation">Participation</option>
                        </select>
                        <Input name="targetDate" type="date" />
                      </div>
                      <Textarea maxLength={2000} name="evidence" placeholder="Starting evidence (optional)" rows={2} />
                      <Button size="sm">Add goal</Button>
                    </form>
                  </details>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Learning profile</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><p className="font-medium">Interests</p><p className="text-muted-foreground">{formatList(profile?.interests)}</p></div>
                <div><p className="font-medium">Parent priorities</p><p className="text-muted-foreground">{profile?.parent_priorities || "Not recorded yet"}</p></div>
                <p className="text-xs text-muted-foreground">
                  Keep this concise. The session note below is the working handover, not a school report.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session note</CardTitle>
            </CardHeader>
            <CardContent>
              <TeacherSessionNote learnerId={id} today={today} assignments={sessionAssignments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-5 pt-4" value="attendance">
          <Card>
            <CardHeader><CardTitle>Record attendance</CardTitle></CardHeader>
            <CardContent>
              <form action={recordAttendance} className="space-y-4">
                <input name="learnerId" type="hidden" value={id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="attendanceDate">Date</Label>
                    <Input defaultValue={today} id="attendanceDate" name="attendanceDate" required type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendanceStatus">Status</Label>
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="present" id="attendanceStatus" name="status">
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                      <option value="authorised_absence">Authorised absence</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendanceNote">Optional note</Label>
                  <Input id="attendanceNote" maxLength={500} name="note" placeholder="Only if useful for follow-up" />
                </div>
                <Button>Save attendance</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Attendance history</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(attendanceResult.data || []).length ? attendanceResult.data?.map((item) => {
                const session = relationOne(item.delivery_sessions)
                return (
                  <div className="border-b pb-3 last:border-0" key={item.id}>
                    <p className="font-medium capitalize">{formatDate(item.attendance_date)} · {item.status.replaceAll("_", " ")}</p>
                    {session ? (
                      <p className="mt-1 text-muted-foreground">
                        {session.focus || "Session type not recorded"}
                        {session.starts_at ? ` · ${session.starts_at.slice(0, 5)}` : ""}
                        {session.teacher_name ? ` · ${session.teacher_name}` : ""}
                      </p>
                    ) : null}
                    {item.note ? <p className="text-muted-foreground">{item.note}</p> : null}
                  </div>
                )
              }) : <p className="text-muted-foreground">No attendance recorded yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="pt-4" value="history">
          <Card>
            <CardHeader><CardTitle>Teaching history</CardTitle></CardHeader>
            <CardContent className="space-y-5 text-sm">
              {updates.length ? updates.map((item) => {
                const framework = relationOne(item.teaching_frameworks)
                return (
                  <article className="border-b pb-5 last:border-0" key={item.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{formatDate(item.occurred_on)}</p>
                      {framework?.title ? <Badge variant="outline">{framework.title}</Badge> : null}
                    </div>
                    {item.note_format === "contextual" ? (
                      <div className="mt-3 space-y-1.5">
                        <p><span className="font-medium">Worked on:</span> {item.working_on}</p>
                        {item.support_needed ? <p><span className="font-medium">Support:</span> {item.support_needed}</p> : null}
                        <p><span className="font-medium">Reached:</span> {item.reached}</p>
                        <p><span className="font-medium">Pick up next:</span> {item.next_step}</p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-1.5">
                        <p><span className="font-medium">What happened:</span> {item.what_happened}</p>
                        <p><span className="font-medium">Why it mattered:</span> {item.why_it_mattered}</p>
                        <p><span className="font-medium">Next step:</span> {item.next_step}</p>
                      </div>
                    )}
                  </article>
                )
              }) : <p className="text-muted-foreground">No teaching notes yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {canViewCommercial ? (
          <TabsContent className="space-y-5 pt-4" value="family">
            <Card>
              <CardHeader><CardTitle>Family & place</CardTitle></CardHeader>
              <CardContent className="space-y-5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={paymentStatus === "Paid" ? "default" : "secondary"}>{paymentStatus}</Badge>
                  {latestEntitlement?.period_end ? <span>Paid through {formatDate(latestEntitlement.period_end)}</span> : null}
                </div>
                <div>
                  <p className="font-medium">Recurring place</p>
                  {activePlaces.length ? (
                    <div className="mt-2 space-y-1 text-muted-foreground">
                      {activePlaces.map((place) => {
                        const plan = relationOne(place.session_price_plans)
                        return (
                          <p key={place.id}>
                            {weekdayNames[place.weekday]} · {place.starts_at.slice(0, 5)} · Table {place.table_number}
                            {place.seat_number ? ` · Seat ${place.seat_number}` : ""}
                            {plan ? ` · ${plan.name} · €${(plan.price_cents / 100).toFixed(2)}/session` : ""}
                          </p>
                        )
                      })}
                    </div>
                  ) : <p className="mt-1 text-muted-foreground">No active recurring place.</p>}
                </div>
                <div>
                  <p className="font-medium">Booked paid dates</p>
                  {paidDates.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {paidDates.map((date) => <Badge key={date} variant="outline">{formatDate(date)}</Badge>)}
                    </div>
                  ) : <p className="mt-1 text-muted-foreground">No paid service dates recorded.</p>}
                </div>
                {learner.parent_lead_id ? (
                  <Button asChild variant="outline">
                    <Link href={"/admin/families/" + learner.parent_lead_id}>Open family account</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {canViewCommercial ? (
          <TabsContent className="pt-4" value="communications">
            <Card>
              <CardContent className="pt-6">
                <FamilyCommunications
                  communications={communications}
                  emptyLabel="No parent communications have been recorded for this family yet."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
