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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Parent leads</h2>
        <p className="text-muted-foreground">
          Every parent timetable response submitted through the landing page.
        </p>
      </div>

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
                    <TableHead>Status</TableHead>
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

                      <TableCell>
                        <Badge
                          variant={
                            lead.status === "priority"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {lead.status}
                        </Badge>
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