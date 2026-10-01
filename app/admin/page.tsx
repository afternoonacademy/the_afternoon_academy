import Link from "next/link";

import { TodayDeliveryBoard } from "@/components/admin/today-delivery-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabaseAdmin } from "@/lib/supabase/admin";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const move = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return iso(value);
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const query = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date || "")
    ? query.date!
    : iso(new Date());
  const [
    { data: sessions },
    { data: seats },
    { data: learners },
    { data: attendance },
    { data: tables },
    { data: weeklyTemplates },
    { data: closures },
  ] = await Promise.all([
    supabaseAdmin
      .from("delivery_sessions")
      .select(
        "id, table_number, academy_table_id, starts_at, duration_minutes, teacher_name, focus, status",
      )
      .eq("service_date", date)
      .order("starts_at"),
    supabaseAdmin
      .from("delivery_seats")
      .select("id, delivery_session_id, learner_id, seat_number, status")
      .in("status", ["scheduled", "payment_pending"]),
    supabaseAdmin
      .from("learners")
      .select("id, first_name, year_group")
      .eq("status", "active")
      .order("first_name"),
    supabaseAdmin
      .from("attendance_records")
      .select("learner_id, delivery_session_id, status")
      .eq("attendance_date", date),
    supabaseAdmin
      .from("academy_tables")
      .select("id, table_number, name, seat_capacity")
      .eq("status", "active")
      .order("table_number"),
    supabaseAdmin
      .from("weekly_table_templates")
      .select("weekday, academy_table_id, table_number, starts_at, duration_minutes, teacher_name, focus, effective_from, effective_to")
      .eq("status", "active")
      .eq("weekday", new Date(`${date}T12:00:00`).getDay())
      .lte("effective_from", date)
      .or(`effective_to.is.null,effective_to.gte.${date}`),
    supabaseAdmin
      .from("academy_closures")
      .select("reason,starts_on,ends_on")
      .lte("starts_on", date)
      .gte("ends_on", date),
  ]);

  const sessionIds = new Set((sessions || []).map((session) => session.id));
  const visibleSeats = (seats || []).filter((seat) =>
    sessionIds.has(seat.delivery_session_id),
  );
  const link = (next: Record<string, string>) =>
    `/admin?${new URLSearchParams({ date, ...next })}`;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-3xl bg-[#26345f] p-6 text-white shadow-lg shadow-indigo-950/10">
        <div>
          <p className="text-sm font-semibold text-yellow-200">The daily operating picture</p>
          <h2 className="mt-1 text-3xl font-bold text-white">Today at the Academy</h2>
          <p className="mt-2 max-w-xl text-sm text-indigo-100">See who needs a place, who is expected in the room, and what needs a human follow-up before the day starts.</p>
        </div>
        <form className="flex gap-2" method="get">
          <Input className="w-40 border-white/30 bg-white text-[#26345f]" defaultValue={date} name="date" type="date" />
          <Button className="bg-[#ffde59] text-[#26345f] hover:bg-[#ffe987]" size="sm">View day</Button>
        </form>
      </div>
      {(closures || []).length ? <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"><strong>Academy closed:</strong> {(closures || []).map((closure) => closure.reason).join(" · ")}. The delivery board is shown for reference; do not run a normal Academy session on this date.</div> : null}
      <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm">
        <Link
          className="px-3 py-2 text-sm"
          href={link({ date: move(date, -1) })}
        >
          ← Previous
        </Link>
        <p className="font-semibold">
          {new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date(`${date}T12:00:00`))}
        </p>
        <Link
          className="px-3 py-2 text-sm"
          href={link({ date: move(date, 1) })}
        >
          Next →
        </Link>
      </div>
      <TodayDeliveryBoard
        attendance={attendance || []}
        date={date}
        eligibleLearnerIds={learners?.map((learner) => learner.id) || []}
        learners={learners || []}
        seats={visibleSeats}
        sessions={sessions || []}
        tables={tables || []}
        weeklyTemplates={weeklyTemplates || []}
      />
    </div>
  );
}
