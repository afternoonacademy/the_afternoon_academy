import { supabaseAdmin } from "@/lib/supabase/admin"
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

type DemandRow = {
  child_age: number
  preferred_day: string
  preferred_time: string
  interested_children: number
}

type LeadOverviewRow = {
  parent_lead_id: string
  status: string
  interest_level: string
  child_age: number
  support_needs: string[] | null
  preferred_days: string[] | null
  preferred_times: string[] | null
}

function incrementCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1)
}

function toSortedRows(map: Map<string, number>) {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ")
}

export default async function AdminTrendsPage() {
  const { data: demandData, error: demandError } = await supabaseAdmin
    .from("timetable_demand_view")
    .select("*")
    .order("interested_children", { ascending: false })

  const { data: leadData, error: leadError } = await supabaseAdmin
    .from("lead_overview_view")
    .select("*")
    .order("created_at", { ascending: false })

  if (demandError || leadError) {
    return (
      <div className="rounded-lg border bg-background p-6">
        <h2 className="text-lg font-semibold">Could not load trends</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {demandError?.message || leadError?.message}
        </p>
      </div>
    )
  }

  const demandRows = (demandData || []) as DemandRow[]
  const leadRows = (leadData || []) as LeadOverviewRow[]

  const dayCounts = new Map<string, number>()
  const timeCounts = new Map<string, number>()
  const ageCounts = new Map<string, number>()
  const supportCounts = new Map<string, number>()

  leadRows.forEach((lead) => {
    incrementCount(ageCounts, `Age ${lead.child_age}`)

    lead.preferred_days?.forEach((day) => {
      incrementCount(dayCounts, day)
    })

    lead.preferred_times?.forEach((time) => {
      incrementCount(timeCounts, time)
    })

    lead.support_needs?.forEach((need) => {
      incrementCount(supportCounts, need)
    })
  })

  const sortedDays = toSortedRows(dayCounts)
  const sortedTimes = toSortedRows(timeCounts)
  const sortedAges = toSortedRows(ageCounts)
  const sortedSupportNeeds = toSortedRows(supportCounts)

  const strongestSlot = demandRows[0]
  const totalLeads = leadRows.length
  const priorityLeads = leadRows.filter((lead) => lead.status === "priority").length

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Timetable trends
        </h2>
        <p className="text-muted-foreground">
          Use this page to decide which launch sessions are most viable.
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
              Strongest day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold capitalize">
              {sortedDays[0]?.label || "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Strongest time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {sortedTimes[0]?.label || "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {strongestSlot ? (
        <Card>
          <CardHeader>
            <CardTitle>Current strongest session signal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              Age{" "}
              <span className="font-semibold">{strongestSlot.child_age}</span>{" "}
              on{" "}
              <span className="font-semibold capitalize">
                {strongestSlot.preferred_day}
              </span>{" "}
              at{" "}
              <span className="font-semibold">
                {strongestSlot.preferred_time}
              </span>{" "}
              with{" "}
              <span className="font-semibold">
                {strongestSlot.interested_children}
              </span>{" "}
              interested child
              {strongestSlot.interested_children === 1 ? "" : "ren"}.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preferred days</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleCountTable rows={sortedDays} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferred times</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleCountTable rows={sortedTimes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Child ages</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleCountTable rows={sortedAges} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support needs</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleCountTable
              rows={sortedSupportNeeds.map((row) => ({
                ...row,
                label: formatLabel(row.label),
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demand by age, day and time</CardTitle>
        </CardHeader>
        <CardContent>
          {demandRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No timetable demand has been submitted yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child age</TableHead>
                  <TableHead>Preferred day</TableHead>
                  <TableHead>Preferred time</TableHead>
                  <TableHead>Interested children</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandRows.map((row) => (
                  <TableRow
                    key={`${row.child_age}-${row.preferred_day}-${row.preferred_time}`}
                  >
                    <TableCell>{row.child_age}</TableCell>
                    <TableCell className="capitalize">
                      {row.preferred_day}
                    </TableCell>
                    <TableCell>{row.preferred_time}</TableCell>
                    <TableCell>{row.interested_children}</TableCell>
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

function SimpleCountTable({
  rows,
}: {
  rows: {
    label: string
    count: number
  }[]
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No data available yet.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell className="capitalize">{row.label}</TableCell>
            <TableCell className="text-right">{row.count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}