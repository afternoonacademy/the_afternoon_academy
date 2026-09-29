import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase/admin";

const iso = (date: Date) => date.toISOString().slice(0, 10);

export default async function RenewalsPage() {
  const today = new Date();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 21);
  const { data } = await supabaseAdmin
    .from("child_payment_entitlements")
    .select("learner_id, period_end, learners(id, first_name, year_group)")
    .eq("status", "paid")
    .gte("period_end", iso(today))
    .lte("period_end", iso(horizon))
    .order("period_end");
  const rows = data || [];

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-3xl bg-[#26345f] p-6 text-white shadow-lg shadow-indigo-950/10">
        <p className="text-sm font-semibold text-yellow-200">Protect continuity</p>
        <h2 className="mt-1 text-3xl font-bold text-white">Renewal watch</h2>
        <p className="mt-2 max-w-2xl text-sm text-indigo-100">A deliberately small queue: families whose paid learning period ends in the next 21 days. Renew personally—this is a prompt, not an automatic charge.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Need attention</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{rows.length}</p><p className="mt-1 text-xs text-muted-foreground">Paid periods ending soon</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Window</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">21 days</p><p className="mt-1 text-xs text-muted-foreground">From today</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">How to renew</CardTitle></CardHeader><CardContent><p className="text-base font-semibold">Confirm, then record</p><p className="mt-1 text-xs text-muted-foreground">Use the family pipeline to record paid coverage.</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Families to contact</CardTitle></CardHeader><CardContent className="space-y-2">{rows.length ? rows.map((row) => { const learner = Array.isArray(row.learners) ? row.learners[0] : row.learners; return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-[#fffdf5] p-4" key={`${row.learner_id}-${row.period_end}`}><div><p className="font-semibold">{learner?.first_name || "Learner"}</p><p className="text-sm text-muted-foreground">{learner?.year_group || "Year group to confirm"}</p></div><div className="text-right"><p className="text-sm font-semibold">Coverage ends {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${row.period_end}T12:00:00`))}</p><Link className="text-sm font-semibold text-primary hover:underline" href="/admin/leads">Open family pipeline →</Link></div></div> }) : <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Nothing needs a renewal conversation in the next 21 days.</p>}</CardContent></Card>
    </div>
  );
}
