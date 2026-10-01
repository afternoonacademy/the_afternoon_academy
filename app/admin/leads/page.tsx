import Link from "next/link"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { PaymentActivationTable } from "@/components/admin/payment-activation-table"
import { FamilyFollowUpTable } from "@/components/admin/family-follow-up-table"

type LeadOverviewRow = {
  parent_lead_id: string
  child_lead_id: string
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

  const { data: familyLeads } = await supabaseAdmin
    .from("parent_leads")
    .select("id, parent_name, email, status")
    .not("status", "in", '("converted","closed")')
    .order("created_at", { ascending: false })
  const { data: familyChildren } = await supabaseAdmin
    .from("child_leads")
    .select("id, parent_lead_id, first_name, child_age, school_year")
    .order("created_at")
  const { data: bookableSlots } = await supabaseAdmin
    .from("weekly_table_templates")
    .select("id, weekday, table_number, academy_table_id, starts_at, duration_minutes")
    .eq("status", "active")
    .order("weekday")
    .order("starts_at")
    .order("table_number")
  const [{ data: activeBookings }, { data: academyTables }, { data: pricePlans }] = await Promise.all([
    supabaseAdmin.from("accepted_bookings").select("weekday, academy_table_id, starts_at, seat_number, learner_id").in("status", ["accepted_awaiting_payment", "paid_active"]),
    supabaseAdmin.from("academy_tables").select("id, seat_capacity").eq("status", "active"),
    supabaseAdmin.from("session_price_plans").select("id,name,price_cents").eq("status", "active").order("price_cents"),
  ])
  const learnerIds = (activeBookings || []).flatMap((booking) => booking.learner_id ? [booking.learner_id] : [])
  const { data: bookedLearners } = learnerIds.length
    ? await supabaseAdmin.from("learners").select("id, first_name").in("id", learnerIds)
    : { data: [] as { id: string; first_name: string | null }[] }
  const learnerNames = new Map((bookedLearners || []).map((learner) => [learner.id, learner.first_name || "Booked learner"]))
  const takenSeats = (activeBookings || []).map((booking) => ({
    key: `${booking.weekday}:${booking.academy_table_id}:${booking.starts_at}:${booking.seat_number}`,
    childName: booking.learner_id ? learnerNames.get(booking.learner_id) || "Booked learner" : "Held place",
  }))
  const seatCapacities = Object.fromEntries((academyTables || []).map((table) => [table.id, table.seat_capacity]))

  const childrenByParent = new Map<string, NonNullable<typeof familyChildren>>()
  for (const child of familyChildren || []) {
    const current = childrenByParent.get(child.parent_lead_id) || []
    current.push(child)
    childrenByParent.set(child.parent_lead_id, current)
  }
  const paymentFamilies = familyLeads || []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div><p className="text-sm font-semibold text-muted-foreground">From first message to a confirmed place</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Family pipeline</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Work at the family level. Keep siblings together, make a thoughtful offer, then only create a learner and dated seat when payment is confirmed.</p></div>
        <Link className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90" href="/admin/leads/new">Add family lead</Link>
      </div>

      <div className="grid divide-y border-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">{pipeline.map(([label, status]) => <div className="px-4 py-3" key={status}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{familyLeads?.filter((lead) => lead.status === status).length || 0}</p></div>)}</div>

      <section className="border-t pt-6">
        <h3 className="text-xl font-bold tracking-tight">3 · Confirm payment, then activate a dated place</h3>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select a family row after you have personally confirmed the transfer. The expanded form records the payment, recurring seat and dated service period in one action.</p>
          <PaymentActivationTable families={paymentFamilies.map((lead) => ({ ...lead, children: childrenByParent.get(lead.id) || [] }))} pricePlans={pricePlans || []} seatCapacities={seatCapacities} slots={bookableSlots || []} takenSeats={takenSeats} />
        </div>
      </section>
      <section className="border-t pt-6">
        <h3 className="text-xl font-bold tracking-tight">2 · Family follow-up queue · {leads.length} child responses</h3>
        <p className="mt-2 text-sm text-muted-foreground">Use the compact table to move a family through follow-up. Open a row only when you need the supporting detail.</p>
        <div className="mt-5">{leads.length ? <FamilyFollowUpTable leads={leads} /> : <p className="border-y py-5 text-sm text-muted-foreground">No parent leads have been submitted yet.</p>}</div>
      </section>
    </div>
  )
}
