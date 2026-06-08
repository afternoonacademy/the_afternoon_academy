import { supabaseAdmin } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
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
  parent_name: string
  email: string
  phone: string | null
  area: string | null
  school_name: string | null
  interest_level: string
  status: string
  child_age: number
  preferred_days: string[] | null
  preferred_times: string[] | null
  created_at: string
}

type DemandRow = {
  child_age: number
  preferred_day: string
  preferred_time: string
  interested_children: number
}

function formatArray(value: string[] | null) {
  if (!value || value.length === 0) return "Not provided"

  return value.map((item) => item.replaceAll("_", " ")).join(", ")
}

function formatValue(value: string) {
  return value.replaceAll("_", " ")
}

export default async function AdminPage() {
  const { data: leadsData, error: leadsError } = await supabaseAdmin
    .from("lead_overview_view")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: demandData, error: demandError } = await supabaseAdmin
    .from("timetable_demand_view")
    .select("*")
    .order("interested_children", { ascending: false })

  if (leadsError || demandError) {
    return (
      <div className="rounded-lg border bg-background p-6">
        <h2 className="text-lg font-semibold">Could not load admin overview</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {leadsError?.message || demandError?.message}
        </p>
      </div>
    )
  }

  const leads = (leadsData || []) as LeadOverviewRow[]
  const demandRows = (demandData || []) as DemandRow[]

  const totalLeads = leads.length
  const priorityLeads = leads.filter((lead) => lead.status === "priority").length
  const timetableInterested = leads.filter(
    (lead) =>
      lead.interest_level === "very_interested" ||
      lead.interest_level === "priority_launch" ||
      lead.interest_level === "interested_timetable"
  ).length

  const strongestSlot = demandRows[0]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Launch demand overview
        </h2>
        <p className="text-muted-foreground">
          A quick snapshot of parent interest from the landing page form.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalLeads}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Priority leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{priorityLeads}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Timetable-fit leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{timetableInterested}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Strongest signal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strongestSlot ? (
              <div>
                <p className="text-lg font-bold capitalize">
                  {strongestSlot.preferred_day}
                </p>
                <p className="text-sm text-muted-foreground">
                  Age {strongestSlot.child_age} at {strongestSlot.preferred_time}
                </p>
              </div>
            ) : (
              <p className="text-3xl font-bold">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {strongestSlot ? (
        <Card>
          <CardHeader>
            <CardTitle>Current strongest timetable signal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The strongest current signal is for{" "}
              <span className="font-semibold text-foreground">
                age {strongestSlot.child_age}
              </span>{" "}
              on{" "}
              <span className="font-semibold capitalize text-foreground">
                {strongestSlot.preferred_day}
              </span>{" "}
              at{" "}
              <span className="font-semibold text-foreground">
                {strongestSlot.preferred_time}
              </span>
              .
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Latest leads</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leads have been submitted yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Child age</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Times</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 6).map((lead) => (
                  <TableRow key={lead.parent_lead_id}>
                    <TableCell>
                      <div className="font-medium">{lead.parent_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.email}
                      </div>
                    </TableCell>
                    <TableCell>{lead.child_age}</TableCell>
                    <TableCell>{lead.school_name || "Not provided"}</TableCell>
                    <TableCell className="capitalize">
                      {formatArray(lead.preferred_days)}
                    </TableCell>
                    <TableCell>{formatArray(lead.preferred_times)}</TableCell>
                    <TableCell className="capitalize">
                      {formatValue(lead.interest_level)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.status === "priority" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}