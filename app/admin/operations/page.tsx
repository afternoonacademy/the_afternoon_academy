import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseAdmin } from "@/lib/supabase/admin"

function countBy<T extends { status: string }>(items: T[] | null, status: string) {
  return (items || []).filter((item) => item.status === status).length
}

export default async function OperationsPage() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString().slice(0, 10)

  const [learnersResult, attendanceResult, goalsResult, updatesResult] = await Promise.all([
    supabaseAdmin.from("learners").select("id, first_name, status").order("first_name"),
    supabaseAdmin.from("attendance_records").select("status, attendance_date").gte("attendance_date", since),
    supabaseAdmin.from("learner_goals").select("status"),
    supabaseAdmin.from("teacher_updates").select("parent_visible"),
  ])

  const learners = learnersResult.data || []
  const attendance = attendanceResult.data || []
  const recordedPresent = countBy(attendance, "present") + countBy(attendance, "late")
  const attendanceRate = attendance.length ? Math.round((recordedPresent / attendance.length) * 100) : null
  const goals = goalsResult.data || []
  const parentReadyUpdates = (updatesResult.data || []).filter((update) => update.parent_visible).length

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Academy-wide record</p>
        <h2 className="text-3xl font-bold tracking-tight">Operations</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">A factual view of the records entered by the team. Attendance reflects recorded entries from the last 30 days, not expected sessions or a child&apos;s wider school attendance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-base">Active learners</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{countBy(learners, "active")}</p><p className="mt-1 text-sm text-muted-foreground">{countBy(learners, "paused")} paused · {countBy(learners, "left")} left</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Recorded attendance</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{attendanceRate === null ? "—" : `${attendanceRate}%`}</p><p className="mt-1 text-sm text-muted-foreground">{attendance.length} entries in the last 30 days</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Active goals</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{countBy(goals, "active")}</p><p className="mt-1 text-sm text-muted-foreground">{countBy(goals, "achieved")} achieved · {countBy(goals, "paused")} paused</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Parent-ready updates</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{parentReadyUpdates}</p><p className="mt-1 text-sm text-muted-foreground">Reviewed by staff; never sent automatically</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Learner records</CardTitle></CardHeader>
        <CardContent>
          {learners.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{learners.map((learner) => <Link key={learner.id} href={`/admin/learners/${learner.id}`} className="rounded-md border p-3 text-sm hover:bg-muted"><span className="font-medium">{learner.first_name}</span><span className="ml-2 capitalize text-muted-foreground">{learner.status}</span></Link>)}</div> : <p className="text-sm text-muted-foreground">Create a learner record to begin.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
