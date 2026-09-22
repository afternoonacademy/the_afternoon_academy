import Link from "next/link";

import {
  addDeliverySeat,
  cancelDeliverySession,
  createDailyDeliverySession,
  createTutorRoomBooking,
  openWeeklyTableForDate,
  recordAttendance,
  removeDeliverySeat,
  restoreDeliverySession,
  savePaidWeeklyPlace,
  saveWeeklyTableTemplate,
  updateDailyDeliverySession,
} from "@/actions/learners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyDeliveryBoard } from "@/components/admin/daily-delivery-board";
import { supabaseAdmin } from "@/lib/supabase/admin";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const move = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return iso(value);
};

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    room?: string;
    table?: string;
    startsAt?: string;
  }>;
}) {
  const query = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date || "")
    ? query.date!
    : iso(new Date());
  const room = query.room === "tutor" ? "tutor" : "taa1";
  const table = query.table === "2" ? 2 : 1;
  const [
    { data: sessions },
    { data: seats },
    { data: learners },
    { data: attendance },
    { data: bookings },
    { data: leads },
    { data: templates },
    { data: paidEntitlements },
    { data: academyTables },
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
      .select("id, delivery_session_id, learner_id, seat_number, status"),
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
      .from("tutor_room_bookings")
      .select("id, teacher_name, starts_at, ends_at")
      .order("starts_at")
      .limit(12),
    supabaseAdmin
      .from("parent_leads")
      .select("id, parent_name")
      .not("status", "in", '("closed")')
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("weekly_table_templates")
      .select(
        "weekday, table_number, academy_table_id, starts_at, duration_minutes, teacher_name, focus, effective_from, effective_to",
      )
      .eq("status", "active"),
    supabaseAdmin
      .from("child_payment_entitlements")
      .select("learner_id")
      .eq("status", "paid")
      .lte("period_start", date)
      .gte("period_end", date),
    supabaseAdmin
      .from("academy_tables")
      .select("table_number, name")
      .eq("status", "active")
      .order("table_number"),
  ]);
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const tableSessions = (sessions || []).filter(
    (item) => item.table_number === table,
  );
  const tableTemplates = (templates || [])
    .filter(
      (item) =>
        item.weekday === weekday &&
        item.table_number === table &&
        item.effective_from <= date &&
        (!item.effective_to || item.effective_to >= date),
    )
    .sort(
      (a, b) =>
        a.starts_at.localeCompare(b.starts_at) ||
        b.effective_from.localeCompare(a.effective_from),
    );
  const slotStarts = [
    ...new Set([
      ...tableSessions.map((item) => item.starts_at),
      ...tableTemplates.map((item) => item.starts_at),
    ]),
  ].sort();
  const selectedStartsAt =
    query.startsAt && slotStarts.includes(query.startsAt)
      ? query.startsAt
      : slotStarts[0];
  const session = selectedStartsAt
    ? tableSessions.find((item) => item.starts_at === selectedStartsAt)
    : undefined;
  const weeklyTemplate = selectedStartsAt
    ? tableTemplates.find((item) => item.starts_at === selectedStartsAt)
    : undefined;
  const paidLearnerIds = new Set(
    (paidEntitlements || []).map((item) => item.learner_id),
  );
  const paymentMonthEnd = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)),
    0,
  )
    .toISOString()
    .slice(0, 10);
  const eligibleLearners = (learners || []).filter((learner) =>
    paidLearnerIds.has(learner.id),
  );
  const activeSeats = session
    ? (seats || []).filter(
        (seat) =>
          seat.delivery_session_id === session.id &&
          seat.status === "scheduled",
      )
    : [];
  const learnerById = new Map(
    (learners || []).map((learner) => [learner.id, learner]),
  );
  const attendanceMap = new Map(
    (attendance || []).map((item) => [
      `${item.delivery_session_id}:${item.learner_id}`,
      item.status,
    ]),
  );
  const link = (next: Record<string, string>) =>
    `/admin/sessions?${new URLSearchParams({ date, room, table: String(table), ...(selectedStartsAt ? { startsAt: selectedStartsAt } : {}), ...next })}`;

  if (room === "tutor")
    return (
      <div className="space-y-6 pb-10">
        <div className="flex gap-2">
          <Link
            className="rounded-md border px-4 py-2 text-sm"
            href={link({ room: "taa1" })}
          >
            TAA1 room
          </Link>
          <span className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Tutor Room
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">One-to-one delivery</p>
          <h2 className="text-3xl font-bold">Tutor Room</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Book a one-to-one appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={createTutorRoomBooking}
              className="grid gap-3 sm:grid-cols-2"
            >
              <select
                className="h-10 rounded-md border bg-background px-3"
                name="learnerId"
              >
                <option value="">Enrolled learner</option>
                {(learners || []).map((learner) => (
                  <option key={learner.id} value={learner.id}>
                    {learner.first_name}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border bg-background px-3"
                name="parentLeadId"
              >
                <option value="">Or parent lead</option>
                {(leads || []).map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.parent_name}
                  </option>
                ))}
              </select>
              <Input name="teacherName" placeholder="Teacher" required />
              <Input name="startsAt" type="datetime-local" required />
              <Input name="endsAt" type="datetime-local" required />
              <Button className="min-h-11">Book Tutor Room</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(bookings || []).map((booking) => (
              <p className="rounded border p-3 text-sm" key={booking.id}>
                {new Date(booking.starts_at).toLocaleString("en-GB")} ·{" "}
                {booking.teacher_name}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Daily delivery board</p>
          <h2 className="text-3xl font-bold">TAA1</h2>
        </div>
        <form className="flex gap-2" method="get">
          <input name="room" type="hidden" value="taa1" />
          <input name="table" type="hidden" value={table} />
          {selectedStartsAt ? (
            <input name="startsAt" type="hidden" value={selectedStartsAt} />
          ) : null}
          <Input className="w-40" defaultValue={date} name="date" type="date" />
          <Button size="sm">View day</Button>
        </form>
      </div>
      <div className="flex gap-2">
        <span className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          TAA1 room
        </span>
        <Link
          className="rounded-md border px-4 py-2 text-sm"
          href={link({ room: "tutor" })}
        >
          Tutor Room
        </Link>
      </div>
      <details className="rounded-xl border p-3">
        <summary className="cursor-pointer font-medium">
          Manage weekly bookable timetable
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a new bookable slot or replace an existing slot with the same day,
          table and start time. Daily edits remain separate.
        </p>
        <form
          action={saveWeeklyTableTemplate}
          className="mt-3 grid gap-2 sm:grid-cols-3"
        >
          <select
            className="h-10 rounded-md border bg-background px-3"
            name="weekday"
            required
          >
            <option value="">Day</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
            <option value="0">Sunday</option>
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3"
            name="tableNumber"
            required
          >
            <option value="1">Table 1</option>
            <option value="2">Table 2</option>
          </select>
          <Input name="startsAt" required type="time" />
          <Input
            name="durationMinutes"
            defaultValue="50"
            min="15"
            required
            type="number"
          />
          <Input name="teacherName" placeholder="Teacher (optional)" />
          <Input
            name="focus"
            defaultValue="General homework support"
            required
          />
          <input name="effectiveFrom" type="hidden" value={date} />
          <Button className="sm:col-span-3">Save bookable slot</Button>
        </form>
      </details>
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
      <div className="flex gap-2">
        <Link
          className={
            table === 1
              ? "rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
              : "rounded-full border px-4 py-2 text-sm"
          }
          href={link({ table: "1" })}
        >
          Table 1
        </Link>
        <Link
          className={
            table === 2
              ? "rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
              : "rounded-full border px-4 py-2 text-sm"
          }
          href={link({ table: "2" })}
        >
          Table 2
        </Link>
      </div>
      {slotStarts.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/20 p-3">
          <span className="text-sm font-medium">Session time</span>
          {slotStarts.map((startsAt) => (
            <Link
              className={
                startsAt === selectedStartsAt
                  ? "rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
                  : "rounded-full border px-4 py-2 text-sm"
              }
              href={link({ startsAt })}
              key={startsAt}
            >
              {startsAt.slice(0, 5)}
            </Link>
          ))}
        </div>
      ) : null}
      <details className="rounded-xl border bg-muted/20 p-3">
        <summary className="cursor-pointer font-medium">
          Set a paid weekly place
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          Use this after payment is received. It records this child’s paid
          period and standing seat; opening each matching date will seat them
          automatically.
        </p>
        <form
          action={savePaidWeeklyPlace}
          className="mt-3 grid gap-2 sm:grid-cols-2"
        >
          <select
            className="h-10 rounded-md border bg-background px-3"
            name="learnerId"
            required
          >
            <option value="">Learner</option>
            {(learners || []).map((learner) => (
              <option key={learner.id} value={learner.id}>
                {learner.first_name}
                {learner.year_group ? ` · ${learner.year_group}` : ""}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3"
            defaultValue={table}
            name="tableNumber"
          >
            <option value="1">Table 1</option>
            <option value="2">Table 2</option>
          </select>
          <Input
            defaultValue={date.slice(0, 7) + "-01"}
            name="periodStart"
            required
            type="date"
          />
          <Input
            defaultValue={paymentMonthEnd}
            name="periodEnd"
            required
            type="date"
          />
          <input name="weekday" type="hidden" value={weekday} />
          <select
            className="h-10 rounded-md border bg-background px-3"
            name="seatNumber"
            required
          >
            <option value="">Seat</option>
            {[1, 2, 3, 4, 5, 6].map((number) => (
              <option key={number} value={number}>
                Seat {number}
              </option>
            ))}
          </select>
          <Input
            defaultValue={weeklyTemplate?.starts_at?.slice(0, 5) || "17:00"}
            name="startsAt"
            required
            type="time"
          />
          <Input
            defaultValue={weeklyTemplate?.duration_minutes || 50}
            name="durationMinutes"
            required
            type="number"
          />
          <Input
            defaultValue={weeklyTemplate?.teacher_name || ""}
            name="teacherName"
            placeholder="Teacher"
          />
          <Input
            defaultValue={weeklyTemplate?.focus || "General homework support"}
            name="focus"
            required
          />
          <Button className="sm:col-span-2">Save paid weekly place</Button>
        </form>
      </details>
      <DailyDeliveryBoard
        attendance={attendance || []}
        date={date}
        eligibleLearnerIds={[...paidLearnerIds]}
        learners={learners || []}
        seats={seats || []}
        sessions={sessions || []}
        tables={academyTables || []}
        weekday={weekday}
        weeklyTemplates={templates || []}
      />
      <div className="hidden">
        <Card>
          <CardHeader>
            <CardTitle>
              Table {table}{" "}
              {session ? (
                <span className="text-base font-normal text-muted-foreground">
                  · {session.starts_at.slice(0, 5)} · {session.teacher_name} ·{" "}
                  {session.focus}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!session ? (
              <div className="space-y-4">
                {weeklyTemplate ? (
                  <>
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <p className="font-medium">Weekly default ready</p>
                      <p>
                        {weeklyTemplate.starts_at.slice(0, 5)} ·{" "}
                        {weeklyTemplate.teacher_name || "Teacher to confirm"} ·{" "}
                        {weeklyTemplate.focus}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Open this table to create today’s editable copy and
                        place currently paid learners in their standing seats.
                      </p>
                    </div>
                    <form action={openWeeklyTableForDate}>
                      <input name="serviceDate" type="hidden" value={date} />
                      <input name="tableNumber" type="hidden" value={table} />
                      <Button className="min-h-11">
                        Open this table for {date}
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      There is no weekly default for this table on this day yet.
                      Set it once; each matching day can still be changed later.
                    </p>
                    <form
                      action={saveWeeklyTableTemplate}
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      <input name="weekday" type="hidden" value={weekday} />
                      <input name="tableNumber" type="hidden" value={table} />
                      <input name="effectiveFrom" type="hidden" value={date} />
                      <Input
                        name="teacherName"
                        placeholder="Teacher (optional)"
                      />
                      <Input
                        name="focus"
                        defaultValue="General homework support"
                        required
                      />
                      <Input
                        name="startsAt"
                        defaultValue="17:00"
                        type="time"
                        required
                      />
                      <Input
                        name="durationMinutes"
                        defaultValue="50"
                        type="number"
                        required
                      />
                      <Button className="min-h-11 sm:col-span-2">
                        Save weekly default
                      </Button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              <>
                <details className="mb-4 rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">
                    Edit this date / manage plan
                  </summary>
                  <form
                    action={updateDailyDeliverySession}
                    className="mt-3 grid gap-2 sm:grid-cols-2"
                  >
                    <input
                      name="deliverySessionId"
                      type="hidden"
                      value={session.id}
                    />
                    <input name="serviceDate" type="hidden" value={date} />
                    <input name="tableNumber" type="hidden" value={table} />
                    <Input
                      defaultValue={session.teacher_name || ""}
                      name="teacherName"
                      required
                    />
                    <Input
                      defaultValue={session.focus || ""}
                      name="focus"
                      required
                    />
                    <Input
                      defaultValue={session.starts_at.slice(0, 5)}
                      name="startsAt"
                      type="time"
                      required
                    />
                    <Input
                      defaultValue={session.duration_minutes}
                      name="durationMinutes"
                      type="number"
                      required
                    />
                    <Button>Save changes</Button>
                  </form>
                  <p className="mt-3 text-sm text-muted-foreground">
                    This changes this date only. Your weekly default remains
                    unchanged.
                  </p>
                </details>
                {session.status === "cancelled" ? (
                  <form action={restoreDeliverySession}>
                    <input
                      name="deliverySessionId"
                      type="hidden"
                      value={session.id}
                    />
                    <Button>Restore table</Button>
                  </form>
                ) : (
                  <>
                    <div className="mx-auto grid max-w-md grid-cols-3 gap-3 rounded-[2rem] border-8 border-amber-900 bg-amber-100 p-6">
                      {[1, 2, 3, 4, 5, 6].map((number) => {
                        const seat = activeSeats.find(
                          (item) => item.seat_number === number,
                        );
                        const learner = seat
                          ? learnerById.get(seat.learner_id)
                          : undefined;
                        return (
                          <div
                            className={
                              learner
                                ? "min-h-24 rounded-full bg-primary p-3 text-center text-xs text-primary-foreground"
                                : "min-h-24 rounded-full border-2 border-emerald-500 bg-emerald-50 p-3 text-center text-xs text-emerald-800"
                            }
                            key={number}
                          >
                            {learner ? (
                              <>
                                <p className="font-semibold">
                                  {learner.first_name}
                                </p>
                                <form
                                  action={recordAttendance}
                                  className="mt-2"
                                >
                                  <input
                                    name="learnerId"
                                    type="hidden"
                                    value={learner.id}
                                  />
                                  <input
                                    name="attendanceDate"
                                    type="hidden"
                                    value={date}
                                  />
                                  <input
                                    name="deliverySessionId"
                                    type="hidden"
                                    value={session.id}
                                  />
                                  <input
                                    name="status"
                                    type="hidden"
                                    value="present"
                                  />
                                  <Button
                                    className="h-8 text-xs"
                                    disabled={
                                      attendanceMap.get(
                                        `${session.id}:${learner.id}`,
                                      ) === "present"
                                    }
                                    size="sm"
                                  >
                                    {attendanceMap.get(
                                      `${session.id}:${learner.id}`,
                                    ) === "present"
                                      ? "✓"
                                      : "Present"}
                                  </Button>
                                </form>
                                <form
                                  action={removeDeliverySeat}
                                  className="mt-1"
                                >
                                  <input
                                    name="deliverySeatId"
                                    type="hidden"
                                    value={seat!.id}
                                  />
                                  <Button
                                    className="h-7 text-xs"
                                    size="sm"
                                    variant="outline"
                                  >
                                    Remove
                                  </Button>
                                </form>
                              </>
                            ) : (
                              <>
                                Seat {number}
                                <p className="mt-2 font-semibold">Available</p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <form
                      action={addDeliverySeat}
                      className="mt-5 grid gap-2 sm:grid-cols-3"
                    >
                      <input
                        name="deliverySessionId"
                        type="hidden"
                        value={session.id}
                      />
                      <select
                        className="h-10 rounded-md border bg-background px-3"
                        name="learnerId"
                        required
                      >
                        <option value="">Add learner</option>
                        {eligibleLearners.map((learner) => (
                          <option key={learner.id} value={learner.id}>
                            {learner.first_name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="h-10 rounded-md border bg-background px-3"
                        name="seatNumber"
                        required
                      >
                        <option value="">Seat</option>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <Button disabled={!eligibleLearners.length}>
                        Add eligible learner
                      </Button>
                    </form>
                    <form action={cancelDeliverySession} className="mt-4">
                      <input
                        name="deliverySessionId"
                        type="hidden"
                        value={session.id}
                      />
                      <Button variant="outline">Cancel this table</Button>
                    </form>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
