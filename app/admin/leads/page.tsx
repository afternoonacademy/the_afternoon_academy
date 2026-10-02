import Link from "next/link"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { FamilyFollowUpTable } from "@/components/admin/family-follow-up-table"
import { RenewalWorkflowTable } from "@/components/admin/renewal-workflow-table"
import { loadFamilyRenewals } from "@/lib/admin/family-renewals"

type LeadOverviewRow = {
  parent_lead_id: string
  child_lead_id: string
  child_first_name: string | null
  timetable_preference_id: string
  parent_name: string
  email: string
  phone: string | null
  area: string | null
  school_name: string | null
  interest_level: string
  status: string
  source: string
  enquiry_type: string
  child_age: number
  school_year: string | null
  curriculum: string | null
  support_needs: string[] | null
  notes: string | null
  focus_group_code: string | null
  focus_group_preferred_session: string | null
  course_or_exam_board: string | null
  preferred_days: string[] | null
  preferred_times: string[] | null
  preferred_frequency: string | null
  created_at: string
}

export default async function AdminLeadsPage() {
  const { data, error } = await supabaseAdmin
    .from("lead_overview_view")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <div className="rounded-lg border bg-background p-6">
        <h2 className="text-lg font-semibold">Could not load leads</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  const leads = (data || []) as LeadOverviewRow[]
  const renewalRows = await loadFamilyRenewals()
  const pipeline = [
    ["Lead received", "new"],
    ["Session planned", "session_planned"],
    ["Contacted", "contacted"],
    ["Paid", "paid"],
  ] as const

  const { data: familyChildren } = await supabaseAdmin
    .from("child_leads")
    .select("id, parent_lead_id, first_name, child_age, school_year, school_name, pipeline_status")
    .order("created_at")
  const { data: bookableSlots } = await supabaseAdmin
    .from("weekly_table_templates")
    .select("id, weekday, table_number, academy_table_id, starts_at, duration_minutes, teacher_name, focus")
    .eq("status", "active")
    .order("weekday")
    .order("starts_at")
    .order("table_number")
  const [
    { data: pricePlans },
    { data: academyClosures },
    { data: academyTables },
    { data: activeBookings },
  ] = await Promise.all([
    supabaseAdmin
      .from("session_price_plans")
      .select("id,name,price_cents")
      .eq("status", "active")
      .order("price_cents"),
    supabaseAdmin
      .from("academy_closures")
      .select("starts_on,ends_on,reason")
      .order("starts_on"),
    supabaseAdmin
      .from("academy_tables")
      .select("id,seat_capacity")
      .eq("status", "active"),
    supabaseAdmin
      .from("accepted_bookings")
      .select("id,child_lead_id,weekly_table_template_id,session_price_plan_id,weekday,table_number,academy_table_id,seat_number,starts_at,duration_minutes,status,planned_sessions,planned_amount_cents,planned_period_start,planned_period_end,child_leads(first_name)")
      .in("status", ["session_planned", "contacted", "accepted_awaiting_payment", "paid_active"]),
  ])
  const closures = (academyClosures || []).map((closure) => ({
    startsOn: closure.starts_on,
    endsOn: closure.ends_on,
    reason: closure.reason,
  }))
  const seatCapacities = Object.fromEntries(
    (academyTables || []).map((table) => [table.id, table.seat_capacity]),
  )

  const childById = new Map(
    (familyChildren || []).map((child) => [child.id, child]),
  )
  const childPipelineRows = leads.map((lead) => {
    const child = childById.get(lead.child_lead_id)
    return {
      ...lead,
      child_first_name: child?.first_name || null,
      school_name: child?.school_name || lead.school_name,
      status: child?.pipeline_status || "new",
    }
  })
  const followUpLeads = childPipelineRows.filter(
    (lead) => !["paid", "closed"].includes(lead.status),
  )

  const seatHolds = (activeBookings || []).map((booking) => {
    const relatedChild = Array.isArray(booking.child_leads)
      ? booking.child_leads[0]
      : booking.child_leads
    return {
      childLeadId: booking.child_lead_id,
      childName: relatedChild?.first_name || "Child",
      weekday: booking.weekday,
      academyTableId: booking.academy_table_id,
      startsAt: booking.starts_at,
      seatNumber: booking.seat_number,
      status: booking.status,
    }
  })

  const plannedBookings = (activeBookings || []).map((booking) => ({
    id: booking.id,
    child_lead_id: booking.child_lead_id,
    weekly_table_template_id: booking.weekly_table_template_id,
    session_price_plan_id: booking.session_price_plan_id,
    weekday: booking.weekday,
    table_number: booking.table_number,
    academy_table_id: booking.academy_table_id,
    seat_number: booking.seat_number,
    starts_at: booking.starts_at,
    duration_minutes: booking.duration_minutes,
    status: booking.status,
    planned_sessions: Array.isArray(booking.planned_sessions)
      ? booking.planned_sessions
      : [],
    planned_amount_cents: booking.planned_amount_cents,
    planned_period_start: booking.planned_period_start,
    planned_period_end: booking.planned_period_end,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div><p className="text-sm font-semibold text-muted-foreground">From first message to a confirmed place</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Family pipeline</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Review each child independently: plan a recurring capacity place, contact the parent, then confirm cleared payment before creating the learner’s dated Operations places.</p></div>
        <Link className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90" href="/admin/leads/new">Add family lead</Link>
      </div>

      <div className="grid divide-y border-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">{pipeline.map(([label, status]) => <div className="px-4 py-3" key={status}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{childPipelineRows.filter((lead) => lead.status === status).length}</p></div>)}</div>

      <section className="border-t pt-6">
        <h3 className="text-xl font-bold tracking-tight">2 · Family follow-up queue · {followUpLeads.length} child responses</h3>
        <p className="mt-2 text-sm text-muted-foreground">Open Details, choose a recurring table/time, price plan and visible capacity seat, then record the planned place. Email the parent only after the plan is checked; payment confirmation is a separate final step.</p>
        <div className="mt-5">{followUpLeads.length ? (
          <FamilyFollowUpTable
            closures={closures}
            leads={followUpLeads}
            plannedBookings={plannedBookings}
            pricePlans={pricePlans || []}
            seatCapacities={seatCapacities}
            seatHolds={seatHolds}
            slots={bookableSlots || []}
          />
        ) : (
          <p className="border-y py-5 text-sm text-muted-foreground">No parent leads have been submitted yet.</p>
        )}</div>
      </section>

      <section className="border-t pt-6" id="renewals">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold tracking-tight">
              3 · Needs renewal · {renewalRows.length} learner
              {renewalRows.length === 1 ? "" : "s"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Existing learners keep their recurring capacity after the last paid
              date. Plan the next period, send the renewal email, then confirm
              cleared payment using the same staged process as a new family.
              Capacity is released only through the explicit Release recurring
              place action.
            </p>
          </div>
        </div>

        <div className="mt-5">
          {renewalRows.length ? (
            <RenewalWorkflowTable
              pricePlans={pricePlans || []}
              rows={renewalRows}
            />
          ) : (
            <p className="border-y py-5 text-sm text-muted-foreground">
              No learners need renewal in the current window.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
