import Link from "next/link"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { FamilyFollowUpTable } from "@/components/admin/family-follow-up-table"

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
  const pipeline = [
    ["New", "new"],
    ["Contacted", "contacted"],
    ["Offer sent", "offer_sent"],
    ["Awaiting payment", "accepted_awaiting_payment"],
  ] as const

  const familyStatuses = new Map(
    leads.map((lead) => [lead.parent_lead_id, lead.status]),
  )

  const { data: familyChildren } = await supabaseAdmin
    .from("child_leads")
    .select("id, parent_lead_id, first_name, child_age, school_year, school_name")
    .order("created_at")
  const { data: bookableSlots } = await supabaseAdmin
    .from("weekly_table_templates")
    .select("id, weekday, table_number, academy_table_id, starts_at, duration_minutes, teacher_name, focus")
    .eq("status", "active")
    .order("weekday")
    .order("starts_at")
    .order("table_number")
  const [{ data: pricePlans }, { data: academyClosures }] = await Promise.all([
    supabaseAdmin.from("session_price_plans").select("id,name,price_cents").eq("status", "active").order("price_cents"),
    supabaseAdmin.from("academy_closures").select("starts_on,ends_on,reason").order("starts_on"),
  ])
  const closures = (academyClosures || []).map((closure) => ({ startsOn: closure.starts_on, endsOn: closure.ends_on, reason: closure.reason }))

  const childById = new Map(
    (familyChildren || []).map((child) => [child.id, child]),
  )
  const followUpLeads = leads.map((lead) => {
    const child = childById.get(lead.child_lead_id)
    return {
      ...lead,
      child_first_name: child?.first_name || null,
      school_name: child?.school_name || lead.school_name,
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div><p className="text-sm font-semibold text-muted-foreground">From first message to a confirmed place</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Family pipeline</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Work at the family level. Keep siblings together, make a thoughtful offer, then only create a learner and dated seat when payment is confirmed.</p></div>
        <Link className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90" href="/admin/leads/new">Add family lead</Link>
      </div>

      <div className="grid divide-y border-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">{pipeline.map(([label, status]) => <div className="px-4 py-3" key={status}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{[...familyStatuses.values()].filter((value) => value === status).length}</p></div>)}</div>

      <section className="border-t pt-6">
        <h3 className="text-xl font-bold tracking-tight">2 · Family follow-up queue · {followUpLeads.length} child responses</h3>
        <p className="mt-2 text-sm text-muted-foreground">Review each child independently before taking payment. The requested sessions per week and availability are visible in the queue; when one child can be offered a place, use Add payment & dates on that child only.</p>
        <div className="mt-5">{followUpLeads.length ? <FamilyFollowUpTable leads={followUpLeads} pricePlans={pricePlans || []} slots={bookableSlots || []} closures={closures} /> : <p className="border-y py-5 text-sm text-muted-foreground">No parent leads have been submitted yet.</p>}</div>
      </section>
    </div>
  )
}
