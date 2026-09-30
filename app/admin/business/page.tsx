import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase/admin";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}

export default async function BusinessPage() {
  const today = new Date();
  const todayDate = isoDate(today);
  const inFourteenDays = new Date(today);
  inFourteenDays.setDate(today.getDate() + 14);
  const monthStart = isoDate(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const monthEnd = isoDate(
    new Date(today.getFullYear(), today.getMonth() + 1, 0),
  );
  const [
    { data: payments },
    { data: sessions },
    { data: seats },
    { data: tables },
    { data: attendance },
    { count: awaitingPayment },
    { count: endingCoverage },
  ] = await Promise.all([
    supabaseAdmin
      .from("payment_entitlements")
      .select("amount_cents, received_at, status")
      .eq("status", "paid")
      .gte("received_at", `${monthStart}T00:00:00Z`)
      .lte("received_at", `${monthEnd}T23:59:59Z`),
    supabaseAdmin
      .from("delivery_sessions")
      .select("id, academy_table_id")
      .eq("service_date", todayDate)
      .eq("status", "scheduled"),
    supabaseAdmin
      .from("delivery_seats")
      .select("delivery_session_id")
      .eq("status", "scheduled"),
    supabaseAdmin
      .from("academy_tables")
      .select("id, seat_capacity")
      .eq("status", "active"),
    supabaseAdmin
      .from("attendance_records")
      .select("status")
      .gte("attendance_date", monthStart)
      .lte("attendance_date", monthEnd),
    supabaseAdmin
      .from("parent_leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted_awaiting_payment"),
    supabaseAdmin
      .from("child_payment_entitlements")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("period_end", todayDate)
      .lte("period_end", isoDate(inFourteenDays)),
  ]);

  const sessionIds = new Set((sessions || []).map((session) => session.id));
  const bookedToday = (seats || []).filter((seat) =>
    sessionIds.has(seat.delivery_session_id),
  ).length;
  const capacityToday = (sessions || []).reduce(
    (total, session) =>
      total +
      ((tables || []).find((table) => table.id === session.academy_table_id)
        ?.seat_capacity || 6),
    0,
  );
  const recordedRevenue = (payments || []).reduce(
    (total, payment) => total + (payment.amount_cents || 0),
    0,
  );
  const unpricedPayments = (payments || []).filter(
    (payment) => payment.amount_cents === null,
  ).length;
  const attended = (attendance || []).filter(
    (record) => record.status === "present" || record.status === "late",
  ).length;

  const metrics = [
    {
      label: "Payments recorded this month",
      value: formatMoney(recordedRevenue),
      detail: unpricedPayments
        ? `${unpricedPayments} received payment record${unpricedPayments === 1 ? " has" : "s have"} no amount.`
        : "Received transfers with an amount recorded.",
    },
    {
      label: "Today's booked seats",
      value: `${bookedToday}/${capacityToday}`,
      detail: "Group-table capacity only; Tutor Room is separate.",
    },
    {
      label: "Attendance this month",
      value: `${attended}/${attendance?.length || 0}`,
      detail: "Present or late out of attendance records made.",
    },
    {
      label: "Coverage ending soon",
      value: String(endingCoverage || 0),
      detail: "Child payment periods ending in the next 14 days.",
    },
    {
      label: "Offers awaiting payment",
      value: String(awaitingPayment || 0),
      detail: "Accepted family offers not yet activated.",
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-sm text-muted-foreground">Owner view</p>
        <h2 className="text-3xl font-bold">Business</h2>
        <p className="mt-1 text-muted-foreground">
          A compact operational view of cash recorded, delivery use and payment
          risk.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metric.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {metric.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>How to read these figures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            “Payments recorded” is cash whose received date and amount were
            entered. It is not an invoice ledger, forecast or bank-feed
            reconciliation.
          </p>
          <p>
            Payment coverage drives the dated seats teachers see. Record the
            transfer with its coverage dates before relying on the delivery
            board.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
