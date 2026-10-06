import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Metrics = {
  revenueCents: number
  activeFamilyCount: number
  activeLearnerCount: number
  paidSessions: number
  recurringLearnerSessionsPerWeek: number
  teachingBlocksPerWeek: number
  capacityUsed: number
  capacityAvailable: number
  capacityUtilization: number | null
  averageRevenuePerFamilyCents: number | null
  averageRevenuePerLearnerCents: number | null
  renewalsDue: number
  pendingPlannedValueCents: number
}

const money = (cents: number | null) =>
  cents === null
    ? "—"
    : new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
      }).format(cents / 100)

export function PerformanceSummary({
  metrics,
  period,
  operationalDate,
}: {
  metrics: Metrics
  period: string
  operationalDate: string
}) {
  const cards = [
    ["Revenue received", money(metrics.revenueCents), "Paid cash received in the selected period."],
    ["Active families", String(metrics.activeFamilyCount), `${metrics.activeLearnerCount} active learners`],
    ["Paid sessions", String(metrics.paidSessions), "Exact paid service dates in the selected period."],
    ["Recurring learner-sessions / week", String(metrics.recurringLearnerSessionsPerWeek), `${metrics.teachingBlocksPerWeek} active teaching blocks`],
    [
      "Live capacity utilisation",
      metrics.capacityUtilization === null
        ? "—"
        : `${Math.round(metrics.capacityUtilization * 100)}%`,
      `${metrics.capacityUsed}/${metrics.capacityAvailable} paid recurring seat holds`,
    ],
    ["Average revenue / family", money(metrics.averageRevenuePerFamilyCents), "Paying families in the selected period."],
    ["Average revenue / learner", money(metrics.averageRevenuePerLearnerCents), "Learners covered by paid entitlements."],
    ["Renewals due", String(metrics.renewalsDue), "Open renewal cases requiring action."],
    ["Pending planned value", money(metrics.pendingPlannedValueCents), "Planned or contacted bookings only — not revenue."],
  ]

  return (
    <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5170ff]">
            Admin only
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[#26345f]">Performance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cash, customer and live capacity signals. Pending value is kept separate from revenue.
          </p>
        </div>
        <form className="flex items-end gap-2" method="get">
          <input name="date" type="hidden" value={operationalDate} />
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Financial period
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              defaultValue={period}
              name="period"
            >
              <option value="this_month">This month</option>
              <option value="last_month">Last month</option>
              <option value="this_year">This year</option>
            </select>
          </label>
          <button className="h-10 rounded-md bg-[#26345f] px-4 text-sm font-semibold text-white">
            Apply
          </button>
        </form>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, detail]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
