import Link from "next/link";

import { TodayDeliveryBoard } from "@/components/admin/today-delivery-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    { data: paidEntitlements },
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
      .select("id, delivery_session_id, learner_id, seat_number")
      .eq("status", "scheduled"),
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
      .select("id, name, seat_capacity")
      .eq("status", "active")
      .order("table_number"),
    supabaseAdmin
      .from("child_payment_entitlements")
      .select("learner_id")
      .eq("status", "paid")
      .lte("period_start", date)
      .gte("period_end", date),
  ]);

  const sessionIds = new Set((sessions || []).map((session) => session.id));
  const visibleSeats = (seats || []).filter((seat) =>
    sessionIds.has(seat.delivery_session_id),
  );
  const paidLearnerIds = new Set(
    (paidEntitlements || []).map((item) => item.learner_id),
  );
  const attendanceSessionIds = new Set(
    (attendance || []).map((item) => item.delivery_session_id),
  );
  const attendanceOutstanding = (sessions || []).filter(
    (session) => !attendanceSessionIds.has(session.id),
  ).length;
  const totalCapacity = (sessions || []).reduce(
    (total, session) =>
      total +
      ((tables || []).find((item) => item.id === session.academy_table_id)
        ?.seat_capacity || 6),
    0,
  );
  const link = (next: Record<string, string>) =>
    `/admin?${new URLSearchParams({ date, ...next })}`;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Teacher delivery board
          </p>
          <h2 className="text-3xl font-bold">Today at the Academy</h2>
        </div>
        <form className="flex gap-2" method="get">
          <Input className="w-40" defaultValue={date} name="date" type="date" />
          <Button size="sm">View day</Button>
        </form>
      </div>
      <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sessions?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Booked seats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {visibleSeats.length}/{totalCapacity}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Attendance to record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{attendanceOutstanding}</p>
          </CardContent>
        </Card>
      </div>
      <TodayDeliveryBoard
        attendance={attendance || []}
        date={date}
        eligibleLearnerIds={[...paidLearnerIds]}
        learners={learners || []}
        seats={visibleSeats}
        sessions={sessions || []}
        tables={tables || []}
      />
    </div>
  );
}
