import {
  CustomerLifetimeChart,
  RevenueByMonthChart,
} from "@/components/admin/finance-charts"
import { PerformanceSummary } from "@/components/admin/performance-summary"
import { loadFinanceAnalytics } from "@/lib/admin/load-finance-analytics"
import { loadPerformanceMetrics } from "@/lib/admin/load-performance-metrics"
import { requireCapability } from "@/lib/auth/require-capability"

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  await requireCapability("view_commercial_kpis")
  const query = await searchParams
  const period = ["this_month", "last_month", "this_year"].includes(
    query.period || "",
  )
    ? query.period!
    : "this_month"
  const today = new Date().toISOString().slice(0, 10)

  const [performance, analytics] = await Promise.all([
    loadPerformanceMetrics({ periodKey: period, today }),
    loadFinanceAnalytics(),
  ])

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-3xl bg-[#26345f] p-6 text-white">
        <p className="text-sm font-semibold text-yellow-200">Admin only</p>
        <h2 className="mt-1 text-3xl font-bold">Finance & business metrics</h2>
        <p className="mt-2 max-w-2xl text-sm text-indigo-100">
          Revenue, customer value, renewals and capacity without crowding the
          daily teaching workflow.
        </p>
      </div>

      <PerformanceSummary
        metrics={performance.metrics}
        period={performance.period.key}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-muted-foreground">Lifetime revenue</p>
          <p className="mt-1 text-2xl font-bold">
            {money(analytics.lifetimeRevenueCents)}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-muted-foreground">
            Average customer lifetime value
          </p>
          <p className="mt-1 text-2xl font-bold">
            {money(analytics.averageLifetimeValueCents)}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-muted-foreground">
            Families with paid history
          </p>
          <p className="mt-1 text-2xl font-bold">
            {analytics.customerLifetime.length}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <RevenueByMonthChart data={analytics.monthly} />
        <CustomerLifetimeChart data={analytics.customerLifetime} />
      </div>
    </div>
  )
}
