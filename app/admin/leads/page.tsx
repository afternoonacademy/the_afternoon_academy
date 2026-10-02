import Link from "next/link"

import { FamilyFollowUpTable } from "@/components/admin/family-follow-up-table"
import { InfoTip } from "@/components/admin/info-tip"
import {
  FamilyArchiveTable,
  FamilyCustomersTable,
  type FamilyArchiveRow,
  type FamilyCustomerRow,
} from "@/components/admin/family-lifecycle-tables"
import { RenewalWorkflowTable } from "@/components/admin/renewal-workflow-table"
import { loadFamilyRenewals } from "@/lib/admin/family-renewals"
import { supabaseAdmin } from "@/lib/supabase/admin"

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

function relation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

export default async function AdminLeadsPage() {
  const { data, error } = await supabaseAdmin
    .from("lead_overview_view")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <div className="rounded-lg border bg-background p-6">
        <h2 className="text-lg font-semibold">Could not load family pipeline</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  const leads = (data || []) as LeadOverviewRow[]
  const renewalRows = await loadFamilyRenewals()

  const [
    { data: familyChildren },
    { data: bookableSlots },
    { data: pricePlans },
    { data: academyClosures },
    { data: academyTables },
    { data: activeBookings },
    { data: lifecycleLearners },
    { data: lifecyclePlacements },
    { data: lifecycleEntitlements },
    { data: closedRenewals },
  ] = await Promise.all([
    supabaseAdmin
      .from("child_leads")
      .select(
        "id,parent_lead_id,first_name,child_age,school_year,school_name,pipeline_status",
      )
      .order("created_at"),
    supabaseAdmin
      .from("weekly_table_templates")
      .select(
        "id,weekday,table_number,academy_table_id,starts_at,duration_minutes,teacher_name,focus",
      )
      .eq("status", "active")
      .order("weekday")
      .order("starts_at")
      .order("table_number"),
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
      .select(
        "id,child_lead_id,weekly_table_template_id,session_price_plan_id,weekday,table_number,academy_table_id,seat_number,starts_at,duration_minutes,status,planned_sessions,planned_amount_cents,planned_period_start,planned_period_end,child_leads(first_name)",
      )
      .in("status", [
        "session_planned",
        "contacted",
        "accepted_awaiting_payment",
        "paid_active",
      ]),
    supabaseAdmin
      .from("learners")
      .select(
        "id,first_name,year_group,status,child_lead_id,parent_lead_id,parent_leads(parent_name,email)",
      )
      .order("first_name"),
    supabaseAdmin
      .from("standing_placements")
      .select("learner_id,weekday,table_number,starts_at,status")
      .eq("status", "active"),
    supabaseAdmin
      .from("child_payment_entitlements")
      .select("learner_id,period_end,status")
      .eq("status", "paid")
      .order("period_end", { ascending: false }),
    supabaseAdmin
      .from("renewal_cases")
      .select(
        "id,learner_id,parent_lead_id,status,capacity_release_reason,outcome_note,closed_at",
      )
      .eq("status", "not_renewing")
      .order("closed_at", { ascending: false }),
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

  const renewalLearnerIds = new Set(renewalRows.map((row) => row.learnerId))
  const renewalChildLeadIds = new Set(
    renewalRows.flatMap((row) => (row.childLeadId ? [row.childLeadId] : [])),
  )

  const learnerChildLeadIds = new Set(
    (lifecycleLearners || [])
      .filter((learner) => Boolean(learner.child_lead_id))
      .map((learner) => learner.child_lead_id as string),
  )
  const activeLearnerChildLeadIds = new Set(
    (lifecycleLearners || [])
      .filter((learner) => learner.status === "active" && learner.child_lead_id)
      .map((learner) => learner.child_lead_id as string),
  )

  const followUpLeads = childPipelineRows.filter(
    (lead) =>
      !["paid", "closed"].includes(lead.status) &&
      !renewalChildLeadIds.has(lead.child_lead_id) &&
      !activeLearnerChildLeadIds.has(lead.child_lead_id),
  )

  const seatHolds = (activeBookings || []).map((booking) => {
    const relatedChild = relation(booking.child_leads)
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

  const paidThroughByLearner = new Map<string, string>()
  for (const entitlement of lifecycleEntitlements || []) {
    const current = paidThroughByLearner.get(entitlement.learner_id)
    if (!current || entitlement.period_end > current) {
      paidThroughByLearner.set(entitlement.learner_id, entitlement.period_end)
    }
  }

  const placesByLearner = new Map<string, string[]>()
  for (const placement of lifecyclePlacements || []) {
    const current = placesByLearner.get(placement.learner_id) || []
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      placement.weekday
    ]
    current.push(
      day +
        " · " +
        String(placement.starts_at).slice(0, 5) +
        " · Table " +
        placement.table_number,
    )
    placesByLearner.set(placement.learner_id, current)
  }

  const closedRenewalByLearner = new Map(
    (closedRenewals || [])
      .filter((item) => Boolean(item.learner_id))
      .map((item) => [item.learner_id as string, item]),
  )

  const customerRows: FamilyCustomerRow[] = (lifecycleLearners || [])
    .filter(
      (learner) =>
        learner.status === "active" &&
        !renewalLearnerIds.has(learner.id) &&
        !closedRenewalByLearner.has(learner.id) &&
        (placesByLearner.get(learner.id)?.length || 0) > 0,
    )
    .map((learner) => {
      const parent = relation(learner.parent_leads)
      return {
        learnerId: learner.id,
        learnerName: learner.first_name,
        parentName: parent?.parent_name || "Family",
        email: parent?.email || "—",
        yearGroup: learner.year_group,
        paidThrough: paidThroughByLearner.get(learner.id) || null,
        placeSummary:
          placesByLearner.get(learner.id)?.join(" · ") || "Recurring place",
      }
    })

  const archiveRowsByKey = new Map<string, FamilyArchiveRow>()

  for (const learner of lifecycleLearners || []) {
    const closedRenewal = closedRenewalByLearner.get(learner.id)
    if (learner.status !== "left" && !closedRenewal) continue
    const parent = relation(learner.parent_leads)
    archiveRowsByKey.set("learner:" + learner.id, {
      key: "learner:" + learner.id,
      learnerId: learner.id,
      childName: learner.first_name,
      parentName: parent?.parent_name || "Family",
      email: parent?.email || "—",
      reason:
        closedRenewal?.capacity_release_reason ||
        closedRenewal?.outcome_note ||
        (learner.status === "left" ? "Learner left" : "Closed"),
      closedAt: closedRenewal?.closed_at || null,
    })
  }

  for (const lead of childPipelineRows) {
    if (lead.status !== "closed") continue
    if (learnerChildLeadIds.has(lead.child_lead_id)) continue
    archiveRowsByKey.set("lead:" + lead.child_lead_id, {
      key: "lead:" + lead.child_lead_id,
      learnerId: null,
      childName: lead.child_first_name || "Child",
      parentName: lead.parent_name,
      email: lead.email,
      reason: "Lead closed",
      closedAt: null,
    })
  }

  const archiveRows = [...archiveRowsByKey.values()]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            One lifecycle view for every family
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <h2 className="text-3xl font-bold tracking-tight">
              Family pipeline
            </h2>
            <InfoTip label="About the Family pipeline">
              A child appears in one operational queue at a time: Lead,
              Customer, Renewal or Closed / Archived. Renewals reuse the same
              staged booking process while preserving the learner’s recurring
              capacity.
            </InfoTip>
          </div>
        </div>
        <Link
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          href="/admin/leads/new"
        >
          Add family lead
        </Link>
      </div>

      <div className="grid divide-y border-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {[
          ["Leads", followUpLeads.length],
          ["Customers", customerRows.length],
          ["Renewals", renewalRows.length],
          ["Closed / archived", archiveRows.length],
        ].map(([label, count]) => (
          <div className="px-4 py-3" key={String(label)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      <section className="border-t pt-6" id="leads">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xl font-bold tracking-tight">
            1 · Leads · {followUpLeads.length} child response
            {followUpLeads.length === 1 ? "" : "s"}
          </h3>
          <InfoTip label="About Leads">
            New enquiries only. Open Details, plan the child’s recurring place,
            contact the parent, then confirm cleared payment. Once paid, the
            child leaves this queue and becomes a Customer.
          </InfoTip>
        </div>
        <div className="mt-5">
          {followUpLeads.length ? (
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
            <p className="border-y py-5 text-sm text-muted-foreground">
              No new child enquiries need follow-up.
            </p>
          )}
        </div>
      </section>

      <section className="border-t pt-6" id="customers">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xl font-bold tracking-tight">
            2 · Customers · {customerRows.length} active learner
            {customerRows.length === 1 ? "" : "s"}
          </h3>
          <InfoTip label="About Customers">
            Active paid learners who do not currently need renewal. Learners
            move out of this table automatically when their paid period reaches
            the renewal window.
          </InfoTip>
        </div>
        <div className="mt-5">
          {customerRows.length ? (
            <FamilyCustomersTable rows={customerRows} />
          ) : (
            <p className="border-y py-5 text-sm text-muted-foreground">
              No active customers are outside the renewal window.
            </p>
          )}
        </div>
      </section>

      <section className="border-t pt-6" id="renewals">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xl font-bold tracking-tight">
            3 · Renewals · {renewalRows.length} learner
            {renewalRows.length === 1 ? "" : "s"}
          </h3>
          <InfoTip label="About Renewals">
            These learners are removed from Leads and Customers while renewal
            is due. Their existing recurring capacity stays reserved until
            renewal is paid or an admin explicitly releases the place.
          </InfoTip>
        </div>
        <div className="mt-5">
          {renewalRows.length ? (
            <RenewalWorkflowTable
              pricePlans={pricePlans || []}
              rows={renewalRows}
            />
          ) : (
            <p className="border-y py-5 text-sm text-muted-foreground">
              No learners currently need renewal.
            </p>
          )}
        </div>
      </section>

      <section className="border-t pt-6" id="archive">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xl font-bold tracking-tight">
            4 · Closed / archived · {archiveRows.length} record
            {archiveRows.length === 1 ? "" : "s"}
          </h3>
          <InfoTip label="About Closed and archived">
            Historical outcomes stay here rather than disappearing. This
            includes closed leads and learners whose recurring place was
            released after cancellation or non-payment.
          </InfoTip>
        </div>
        <div className="mt-5">
          {archiveRows.length ? (
            <FamilyArchiveTable rows={archiveRows} />
          ) : (
            <p className="border-y py-5 text-sm text-muted-foreground">
              No closed or archived family records yet.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
