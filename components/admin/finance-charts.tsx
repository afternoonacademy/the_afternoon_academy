const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100)

export function RevenueByMonthChart({
  data,
}: {
  data: Array<{ key: string; label: string; revenueCents: number }>
}) {
  const max = Math.max(1, ...data.map((item) => item.revenueCents))
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h3 className="font-bold">Revenue by month</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Cash received in the current calendar year.
      </p>
      <div className="mt-6 grid grid-cols-12 items-end gap-2">
        {data.map((item) => (
          <div className="flex min-w-0 flex-col items-center gap-2" key={item.key}>
            <div className="flex h-44 w-full items-end">
              <div
                className="w-full rounded-t-md bg-[#5170ff]"
                style={{
                  height: `${Math.max(
                    item.revenueCents ? 8 : 2,
                    (item.revenueCents / max) * 100,
                  )}%`,
                }}
                title={money(item.revenueCents)}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CustomerLifetimeChart({
  data,
}: {
  data: Array<{
    parentLeadId: string
    parentName: string
    revenueCents: number
  }>
}) {
  const shown = data.slice(0, 10)
  const max = Math.max(1, ...shown.map((item) => item.revenueCents))
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h3 className="font-bold">Revenue by customer lifetime</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Total collected revenue by family since records began.
      </p>
      <div className="mt-5 space-y-3">
        {shown.map((item) => (
          <div key={item.parentLeadId}>
            <div className="mb-1 flex justify-between gap-4 text-sm">
              <span className="truncate font-medium">{item.parentName}</span>
              <span className="shrink-0 font-semibold">
                {money(item.revenueCents)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#26345f]"
                style={{ width: `${(item.revenueCents / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
