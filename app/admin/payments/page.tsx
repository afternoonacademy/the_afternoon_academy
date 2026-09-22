import { recordRenewalPayment } from "@/actions/learners";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabaseAdmin } from "@/lib/supabase/admin";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function formatMoney(amountCents: number | null, currency: string | null) {
  if (amountCents === null) return "Amount not recorded";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(amountCents / 100);
}

export default async function PaymentsPage() {
  const today = new Date();
  const inFourteenDays = new Date(today);
  inFourteenDays.setDate(today.getDate() + 14);
  const monthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const [
    { data: learners },
    { data: families },
    { data: payments },
    { data: endingEntitlements },
  ] = await Promise.all([
    supabaseAdmin
      .from("learners")
      .select("id, first_name, parent_lead_id")
      .eq("status", "active")
      .order("first_name"),
    supabaseAdmin
      .from("parent_leads")
      .select("id, parent_name")
      .order("parent_name"),
    supabaseAdmin
      .from("payment_entitlements")
      .select(
        "id, parent_lead_id, period_start, period_end, amount_cents, currency, received_at, note, status",
      )
      .order("received_at", { ascending: false })
      .limit(40),
    supabaseAdmin
      .from("child_payment_entitlements")
      .select("learner_id, period_end, status")
      .eq("status", "paid")
      .gte("period_end", isoDate(today))
      .lte("period_end", isoDate(inFourteenDays))
      .order("period_end"),
  ]);

  const familyById = new Map(
    (families || []).map((family) => [family.id, family]),
  );
  const learnerById = new Map(
    (learners || []).map((learner) => [learner.id, learner]),
  );
  const renewableFamilies = (families || []).filter((family) =>
    (learners || []).some((learner) => learner.parent_lead_id === family.id),
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-sm text-muted-foreground">Payment operations</p>
        <h2 className="text-3xl font-bold">Payments</h2>
        <p className="mt-1 text-muted-foreground">
          Record a bank transfer against the dates it covers. Active standing
          places create the dated learner seats for that paid period.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record received payment</CardTitle>
          <CardDescription>
            Use this for a renewal or transfer received after the child has
            already attended. It does not change historic attendance or seats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={recordRenewalPayment}
            className="grid gap-3 md:grid-cols-2"
          >
            <select
              className="h-10 rounded-md border bg-background px-3 md:col-span-2"
              defaultValue=""
              name="parentLeadId"
              required
            >
              <option disabled value="">
                Select family
              </option>
              {renewableFamilies.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.parent_name}
                </option>
              ))}
            </select>
            <label className="space-y-1 text-sm">
              <span>Received on</span>
              <Input
                defaultValue={isoDate(today)}
                name="receivedOn"
                required
                type="date"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Amount (€)</span>
              <Input
                inputMode="decimal"
                min="0"
                name="amountEuros"
                placeholder="Optional"
                step="0.01"
                type="number"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Coverage starts</span>
              <Input
                defaultValue={isoDate(monthStart)}
                name="periodStart"
                required
                type="date"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Coverage ends</span>
              <Input
                defaultValue={isoDate(monthEnd)}
                name="periodEnd"
                required
                type="date"
              />
            </label>
            <Input
              className="md:col-span-2"
              name="bankReference"
              placeholder="Bank reference (optional)"
            />
            <Input
              className="md:col-span-2"
              name="note"
              placeholder="Operational note (optional)"
            />
            <Button className="min-h-11 md:col-span-2">
              Record payment and prepare seats
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coverage ending in 14 days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {endingEntitlements?.length ? (
              endingEntitlements.map((entitlement) => {
                const learner = learnerById.get(entitlement.learner_id);
                return (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    key={`${entitlement.learner_id}-${entitlement.period_end}`}
                  >
                    <span className="font-medium">
                      {learner?.first_name || "Former learner"}
                    </span>
                    <span className="text-muted-foreground">
                      Ends {entitlement.period_end}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No paid coverage ends in the next 14 days.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent payment records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments?.length ? (
              payments.slice(0, 12).map((payment) => (
                <div className="rounded-lg border p-3 text-sm" key={payment.id}>
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">
                      {familyById.get(payment.parent_lead_id)?.parent_name ||
                        "Family"}
                    </span>
                    <span>
                      {formatMoney(payment.amount_cents, payment.currency)}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {payment.period_start} to {payment.period_end}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment records yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
