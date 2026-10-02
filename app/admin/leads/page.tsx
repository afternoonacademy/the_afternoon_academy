import Link from "next/link"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { FamilyFollowUpTable } from "@/components/admin/family-follow-up-table"
import { RenewalWorkflowTable } from "@/components/admin/renewal-workflow-table"
import {
  FamilyArchiveTable,
  FamilyCustomersTable,
  type FamilyArchiveRow,
  type FamilyCustomerRow,
} from "@/components/admin/family-lifecycle-tables"
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            One lifecycle view for every family
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">
            Family pipeline
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            A child appears in one operational queue at a time: Lead, Customer,
            Renewal or Closed / Archived. Renewals reuse the same staged booking
            process while preserving the learner’s recurring capacity.
          </p>
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
        <h3 className="text-xl font-bold tracking-tight">
          1 · Leads · {followUpLeads.length} child response
          {followUpLeads.length === 1 ? "" : "s"}
        </h3>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          New enquiries only. Open Details, plan the child’s recurring place,
          contact the parent, then confirm cleared payment. Once paid, the child
          leaves this queue and becomes a Customer.
        </p>
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
        <h3 className="text-xl font-bold tracking-tight">
          2 · Customers · {customerRows.length} active learner
          {customerRows.length === 1 ? "" : "s"}
        </h3>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Active paid learners who do not currently need renewal. Learners move
          out of this table automatically when their paid period reaches the
          renewal window.
        </p>
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
        <h3 className="text-xl font-bold tracking-tight">
          3 · Renewals · {renewalRows.length} learner
          {renewalRows.length === 1 ? "" : "s"}
        </h3>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          These learners are removed from Leads and Customers while renewal is
          due. Their existing recurring capacity stays reserved until renewal is
          paid or an admin explicitly releases the place.
        </p>
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
        <h3 className="text-xl font-bold tracking-tight">
          4 · Closed / archived · {archiveRows.length} record
          {archiveRows.length === 1 ? "" : "s"}
        </h3>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Historical outcomes stay here rather than disappearing. This includes
          closed leads and learners whose recurring place was released after
          cancellation or non-payment.
        </p>
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
