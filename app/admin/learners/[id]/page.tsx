import { notFound } from "next/navigation"

import { createLearnerGoal, recordAttendance, updateLearnerDetails, updateLearnerGoalStatus, updateLearnerPersonalProfile } from "@/actions/learners"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AiTeacherUpdate } from "@/components/admin/ai-teacher-update"
import { FamilyCommunications } from "@/components/admin/family-communications"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { SessionChangeForm } from "@/components/admin/session-change-form"

type PageProps = { params: Promise<{ id: string }> }

function formatList(items: string[] | null | undefined) {
  return items?.length ? items.join(", ") : "Not recorded yet"
}

export default async function LearnerPage({ params }: PageProps) {
  const { id } = await params
  const [
    learnerResult,
    profileResult,
    attendanceResult,
    updatesResult,
    goalsResult,
    standingResult,
    entitlementResult,
    renewalResult,
  ] = await Promise.all([
    supabaseAdmin.from("learners").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("learner_profiles").select("*").eq("learner_id", id).maybeSingle(),
    supabaseAdmin.from("attendance_records").select("*, delivery_sessions(focus, starts_at, teacher_name)").eq("learner_id", id).order("attendance_date", { ascending: false }),
    supabaseAdmin.from("teacher_updates").select("*").eq("learner_id", id).order("occurred_on", { ascending: false }),
    supabaseAdmin.from("learner_goals").select("*").eq("learner_id", id).order("created_at", { ascending: false }),
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
  ])

  if (!learnerResult.data) notFound()
  const learner = learnerResult.data
  const profile = profileResult.data
  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: changeTemplates },
    { data: changePricePlans },
    { data: parentAccount },
  ] = await Promise.all([
    supabaseAdmin
      .from("weekly_table_templates")
      .select("id,weekday,starts_at,table_number,focus")
      .eq("status", "active")
      .order("weekday")
      .order("starts_at")
      .order("table_number"),
    supabaseAdmin
      .from("session_price_plans")
      .select("id,name,price_cents")
      .eq("status", "active")
      .order("price_cents")
      .order("name"),
    supabaseAdmin
      .from("parent_leads")
      .select("account_adjustments")
      .eq("id", learner.parent_lead_id)
      .maybeSingle(),
  ])

  const { data: communications } = await supabaseAdmin
    .from("email_delivery_log")
    .select(
      "id,parent_lead_id,child_lead_id,learner_id,renewal_case_id,email_kind,recipient_email,status,subject,body_text,sent_at,delivered_at,bounced_at,failed_at,delivery_detail,error_message,created_at,child_leads(first_name),learners(first_name)",
    )
    .eq("parent_lead_id", learner.parent_lead_id)
    .order("created_at", { ascending: false })

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const activePlaces = standingResult.data || []
  const currentPlaces = activePlaces.filter(
    (place) =>
      place.effective_from <= today &&
      (!place.effective_to || place.effective_to >= today),
  )
  const futurePlaces = activePlaces.filter((place) => place.effective_from > today)
  const latestEntitlement = entitlementResult.data
  const renewal = renewalResult.data

  const paidSessionDetails = Array.isArray(latestEntitlement?.selected_sessions)
    ? latestEntitlement.selected_sessions
        .map((session) => {
          if (!session || typeof session !== "object" || Array.isArray(session)) {
            return null
          }
          const value = session as Record<string, unknown>
          if (
            typeof value.date !== "string" ||
            typeof value.startsAt !== "string" ||
            typeof value.priceCents !== "number" ||
            typeof value.pricePlanName !== "string"
          ) {
            return null
          }
          return {
            date: value.date,
            startsAt: value.startsAt,
            priceCents: value.priceCents,
            pricePlanName: value.pricePlanName,
          }
        })
        .filter(
          (
            session,
          ): session is {
            date: string
            startsAt: string
            priceCents: number
            pricePlanName: string
          } => Boolean(session),
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.startsAt.localeCompare(b.startsAt))
    : []

  const paidDates = [...new Set(paidSessionDetails.map((session) => session.date))]

  const accountAdjustments = Array.isArray(parentAccount?.account_adjustments)
    ? (parentAccount.account_adjustments as Array<Record<string, unknown>>)
    : []
  const familyBalanceCents = accountAdjustments.reduce(
    (total, entry) =>
      total + (typeof entry.amountCents === "number" ? entry.amountCents : 0),
    0,
  )

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value + "T12:00:00Z"))

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

  const yearLabel = learner.year_group
    ? `Year ${String(learner.year_group).replace(/^Year\s*/i, "")}`
    : "Year group not recorded"

  const paymentBadgeVariant =
    paymentStatus === "Paid"
      ? "default"
      : paymentStatus === "No active place"
        ? "outline"
        : "secondary"

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Learner workspace · teacher-reviewed AI drafting</p>
          <h2 className="text-3xl font-bold tracking-tight">{learner.first_name}</h2>
          <p className="text-muted-foreground">{yearLabel}</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-sm capitalize">{learner.status}</span>
      </div>

      <section className="rounded-2xl border bg-muted/20 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current booking & payment
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold">
                {learner.first_name} · {yearLabel}
              </h3>
              <Badge variant={paymentBadgeVariant}>{paymentStatus}</Badge>
            </div>
          </div>
          {latestEntitlement?.period_end ? (
            <p className="text-sm font-semibold">
              Paid through {formatDate(latestEntitlement.period_end)}
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-2 text-sm">
            <div>
              <p className="font-medium">Recurring place</p>
              {currentPlaces.length ? (
                <div className="mt-1 space-y-1 text-muted-foreground">
                  {currentPlaces.map((place) => {
                    const plan = Array.isArray(place.session_price_plans)
                      ? place.session_price_plans[0]
                      : place.session_price_plans
                    return (
                      <p key={place.id}>
                        {weekdayNames[place.weekday]} · {place.starts_at.slice(0, 5)} · Table {place.table_number} ·{" "}
                        {place.seat_number ? `Seat ${place.seat_number}` : "Seat not assigned"}
                        {plan
                          ? ` · ${plan.name} · €${(plan.price_cents / 100).toFixed(2)}/session`
                          : ""}
                      </p>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-1 text-muted-foreground">No active recurring place</p>
              )}
            </div>
            {paymentStatus === "Renewal due" || paymentStatus === "Payment pending" ? (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
                Recurring place remains held until an admin releases it.
              </p>
            ) : null}
          </div>

          <div className="text-sm">
            <p className="font-medium">Booked paid dates</p>
            {paidDates.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {paidDates.map((date) => (
                  <span
                    className="rounded-md border bg-background px-2.5 py-1 text-xs"
                    key={date}
                  >
                    {formatDate(date)}
                  </span>
                ))}
              </div>
            ) : latestEntitlement ? (
              <p className="mt-1 text-muted-foreground">
                Paid period {formatDate(latestEntitlement.period_start)} – {formatDate(latestEntitlement.period_end)}
              </p>
            ) : (
              <p className="mt-1 text-muted-foreground">No paid service dates recorded</p>
            )}
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Family account & future sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Family balance
            </p>
            <p className="mt-1 text-2xl font-bold">
              {familyBalanceCents < 0
                ? `€${(Math.abs(familyBalanceCents) / 100).toFixed(2)} credit`
                : familyBalanceCents > 0
                  ? `€${(familyBalanceCents / 100).toFixed(2)} due`
                  : "Settled"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Credits and outstanding adjustments belong to the family. Admins
              decide when they are applied to this learner or a sibling.
            </p>
            {accountAdjustments.length ? (
              <div className="mt-3 space-y-2 text-sm">
                {accountAdjustments.slice(-5).reverse().map((entry, index) => (
                  <div className="rounded-md border bg-background px-3 py-2" key={String(entry.id || index)}>
                    <p className="font-medium">
                      {String(entry.originatingLearnerName || "Learner")} ·{" "}
                      {typeof entry.amountCents === "number" && entry.amountCents < 0
                        ? `€${(Math.abs(entry.amountCents) / 100).toFixed(2)} credit`
                        : typeof entry.amountCents === "number" && entry.amountCents > 0
                          ? `€${(entry.amountCents / 100).toFixed(2)} due`
                          : "No balance change"}
                    </p>
                    {entry.reason ? (
                      <p className="text-muted-foreground">{String(entry.reason)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {futurePlaces.length ? (
            <div className="rounded-md border bg-blue-50 px-3 py-2 text-sm text-blue-950">
              <p className="font-semibold">Future recurring place already scheduled</p>
              {futurePlaces.map((place) => (
                <p key={place.id}>
                  From {formatDate(place.effective_from)} · {weekdayNames[place.weekday]} ·{" "}
                  {place.starts_at.slice(0, 5)} · Table {place.table_number}
                </p>
              ))}
            </div>
          ) : null}

          {latestEntitlement?.period_end && paidSessionDetails.length ? (
            <SessionChangeForm
              learnerId={learner.id}
              paidThrough={latestEntitlement.period_end}
              sessions={paidSessionDetails}
              templates={(changeTemplates || []).map((item) => ({
                id: item.id,
                weekday: item.weekday,
                startsAt: item.starts_at,
                tableNumber: item.table_number,
                focus: item.focus,
              }))}
              plans={(changePricePlans || []).map((item) => ({
                id: item.id,
                name: item.name,
                priceCents: item.price_cents,
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              A current exact-date paid period is required before future paid
              sessions can be changed.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FamilyCommunications
            communications={communications || []}
            emptyLabel="No parent communications have been recorded for this family yet."
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Personal profile</CardTitle></CardHeader>
          <CardContent>
            <SaveActionForm action={updateLearnerPersonalProfile} successMessage="Personal profile saved" submitLabel="Save personal profile">
              <input type="hidden" name="learnerId" value={id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" maxLength={80} defaultValue={learner.first_name} required /></div>
                <div className="space-y-2"><Label htmlFor="yearGroup">Year group</Label><Input id="yearGroup" name="yearGroup" maxLength={80} defaultValue={learner.year_group || ""} /></div>
                <div className="space-y-2"><Label htmlFor="currentSchoolName">Current school</Label><Input id="currentSchoolName" name="currentSchoolName" maxLength={160} defaultValue={learner.current_school_name || ""} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="teacherName">Teacher/contact name</Label><Input id="teacherName" name="teacherName" maxLength={160} defaultValue={learner.teacher_name || ""} /></div><div className="space-y-2"><Label htmlFor="teacherEmail">Teacher/contact email</Label><Input id="teacherEmail" name="teacherEmail" type="email" maxLength={254} defaultValue={learner.teacher_email || ""} /></div></div>
              <div className="space-y-2"><Label htmlFor="teacherPhone">Teacher/contact phone</Label><Input id="teacherPhone" name="teacherPhone" maxLength={50} defaultValue={learner.teacher_phone || ""} /></div>
              <label className="flex gap-3 rounded-md border p-3 text-sm"><input type="checkbox" name="schoolContactPermissionConfirmed" defaultChecked={learner.school_contact_permission_confirmed} /><span>I have confirmed it is appropriate to retain these school contact details for TAA&apos;s educational service.</span></label>
              <p className="text-xs text-muted-foreground">Only record a school contact where it is necessary for the child&apos;s support. Do not add sensitive information to contact fields.</p>
            </SaveActionForm>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Learner details and lifecycle</CardTitle></CardHeader><CardContent><form action={updateLearnerDetails} className="space-y-4"><input type="hidden" name="learnerId" value={id} /><input type="hidden" name="currentSchoolName" value="" /><input type="hidden" name="teacherName" value="" /><input type="hidden" name="teacherEmail" value="" /><input type="hidden" name="teacherPhone" value="" /><div className="space-y-2"><Label htmlFor="learnerStatus">Learner status</Label><select id="learnerStatus" name="status" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue={learner.status}><option value="active">Active</option><option value="paused">Paused</option><option value="left">Left the academy</option></select></div><p className="text-sm text-muted-foreground">Changing status preserves the learner’s attendance and progress history.</p><Button type="submit">Save status</Button></form></CardContent></Card>
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
        <CardHeader><CardTitle>Session note</CardTitle></CardHeader>
        <CardContent>
          <AiTeacherUpdate learnerId={id} today={today} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Full attendance history</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{(attendanceResult.data || []).length ? attendanceResult.data?.map((item) => { const session = Array.isArray(item.delivery_sessions) ? item.delivery_sessions[0] : item.delivery_sessions; return <div key={item.id} className="border-b pb-3 last:border-0"><p className="font-medium capitalize">{item.attendance_date} · {item.status.replaceAll("_", " ")}</p>{session ? <p className="mt-1 text-muted-foreground">{session.focus || "Session type not recorded"}{session.starts_at ? ` · ${session.starts_at.slice(0, 5)}` : ""}{session.teacher_name ? ` · ${session.teacher_name}` : ""}</p> : null}{item.note ? <p className="text-muted-foreground">{item.note}</p> : null}</div> }) : <p className="text-muted-foreground">No attendance recorded yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Internal teaching timeline</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">{(updatesResult.data || []).length ? updatesResult.data?.map((item) => <article key={item.id} className="border-b pb-4 last:border-0"><p className="font-medium">{item.occurred_on}</p><p className="mt-2"><span className="font-medium">What happened:</span> {item.what_happened}</p><p><span className="font-medium">Why it mattered:</span> {item.why_it_mattered}</p><p><span className="font-medium">Next step:</span> {item.next_step}</p></article>) : <p className="text-muted-foreground">No internal session notes yet.</p>}</CardContent></Card>
      </div>
    </div>
  )
}
