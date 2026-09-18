import { supabaseAdmin } from "@/lib/supabase/admin"
import { LeadActions } from "@/components/admin/lead-actions"
import { AcceptedPlaceForm } from "@/components/admin/accepted-place-form"
import { activateAcceptedBookingsPayment, createManualLead } from "@/actions/update-lead-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  child_age: number
  school_year: string | null
  curriculum: string | null
  support_needs: string[] | null
  notes: string | null
  preferred_days: string[] | null
  preferred_times: string[] | null
  preferred_frequency: string | null
  created_at: string
}

function formatArray(value: string[] | null) {
  if (!value || value.length === 0) return "Not provided"
  return value.join(", ")
}

function formatValue(value: string | null) {
  if (!value) return "Not provided"
  return value.replaceAll("_", " ")
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
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

  const { data: familyLeads } = await supabaseAdmin
    .from("parent_leads")
    .select("id, parent_name, email, status")
    .not("status", "in", '("converted","closed")')
    .order("created_at", { ascending: false })
  const { data: familyChildren } = await supabaseAdmin
    .from("child_leads")
    .select("id, parent_lead_id, first_name, child_age, school_year")
    .order("created_at")
  const { data: acceptedBookings } = await supabaseAdmin
    .from("accepted_bookings")
    .select("parent_lead_id, child_lead_id, status")
    .in("status", ["accepted_awaiting_payment", "paid_active"])
  const { data: bookableSlots } = await supabaseAdmin
    .from("weekly_table_templates")
    .select("id, weekday, table_number, starts_at, duration_minutes")
    .eq("status", "active")
    .order("weekday")
    .order("starts_at")
    .order("table_number")

  const childrenByParent = new Map<string, NonNullable<typeof familyChildren>>()
  for (const child of familyChildren || []) {
    const current = childrenByParent.get(child.parent_lead_id) || []
    current.push(child)
    childrenByParent.set(child.parent_lead_id, current)
  }

  const bookedChildIdsByParent = new Map<string, Set<string>>()
  for (const booking of acceptedBookings || []) {
    const ids = bookedChildIdsByParent.get(booking.parent_lead_id) || new Set<string>()
    ids.add(booking.child_lead_id)
    bookedChildIdsByParent.set(booking.parent_lead_id, ids)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Parent leads</h2>
        <p className="text-muted-foreground">
          Every parent timetable response submitted through the landing page.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Accepted place and payment activation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">First record the place the parent accepted. When payment is later confirmed, the children become active and their agreed paid dates are prepared automatically.</p>
          {familyLeads?.length ? familyLeads.map((lead) => {
            const children = childrenByParent.get(lead.id) || []
            const bookedIds = bookedChildIdsByParent.get(lead.id) || new Set<string>()
            const childrenStillToAccept = children.filter((child) => !bookedIds.has(child.id))
            return <div className="space-y-3 rounded-lg border p-4" key={lead.id}>
              <div><p className="font-semibold">{lead.parent_name}</p><p className="text-sm text-muted-foreground">{bookedIds.size} of {children.length} children have an accepted place.</p></div>
              {childrenStillToAccept.length ? <AcceptedPlaceForm parentLeadId={lead.id} children={childrenStillToAccept} slots={bookableSlots || []}/> : <form action={activateAcceptedBookingsPayment}>
                <input name="parentLeadId" type="hidden" value={lead.id}/>
                <p className="mb-2 text-sm text-muted-foreground">All children have accepted places. Record payment to activate their booked sessions.</p>
                <div className="grid gap-2 sm:grid-cols-3"><div><Label>Payment received</Label><Input name="receivedOn" required type="date"/></div><div><Label>First covered session</Label><Input name="periodStart" required type="date"/></div><div><Label>Last covered session</Label><Input name="periodEnd" required type="date"/></div><Button className="sm:col-span-3">Record payment — activate bookings</Button></div>
              </form>}
            </div>
          }) : <p className="text-sm text-muted-foreground">No family leads are awaiting acceptance or payment.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Add a lead received outside the website</CardTitle></CardHeader>
        <CardContent><form action={createManualLead} className="grid gap-3 md:grid-cols-3"><div><Label>Parent name</Label><Input name="parentName" required/></div><div><Label>Email</Label><Input name="email" type="email" required/></div><div><Label>Phone</Label><Input name="phone"/></div><div><Label>Child first name</Label><Input name="childFirstName" required/></div><div><Label>Child age</Label><Input name="childAge" type="number" min="4" max="18" required/></div><div><Label>School year</Label><Input name="schoolYear"/></div><div><Label>Source</Label><select name="source" className="h-10 w-full rounded-md border bg-background px-3" defaultValue="phone"><option value="phone">Phone</option><option value="email">Email</option><option value="referral">Referral</option><option value="walk_in">Walk-in</option><option value="other">Other</option></select></div><Button className="w-fit self-end">Add as new lead</Button></form></CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{leads.length} submitted leads</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No parent leads have been submitted yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>School / area</TableHead>
                    <TableHead>Support</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Times</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.parent_lead_id}>
                      <TableCell>
                        <div className="font-medium">{lead.parent_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Source: {lead.source}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{lead.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {lead.phone || "No phone"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>Age {lead.child_age}</div>
                        <div className="text-xs text-muted-foreground">
                          Year {lead.school_year || "not provided"}
                        </div>
                        <div className="text-xs capitalize text-muted-foreground">
                          {formatValue(lead.curriculum)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{lead.school_name || "No school"}</div>
                        <div className="text-xs text-muted-foreground">
                          {lead.area || "No area"}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[180px] capitalize">
                        {formatArray(lead.support_needs)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {formatArray(lead.preferred_days)}
                      </TableCell>
                      <TableCell>{formatArray(lead.preferred_times)}</TableCell>
                      <TableCell className="capitalize">
                        {formatValue(lead.preferred_frequency)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {formatValue(lead.interest_level)}
                      </TableCell>
                      <TableCell className="min-w-[170px]">
                        <LeadActions
                          leadId={lead.parent_lead_id}
                          parentName={lead.parent_name}
                          status={lead.status as "new" | "warm" | "priority" | "contacted" | "offer_sent" | "accepted_awaiting_payment" | "waitlist" | "converted" | "closed"}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(lead.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
