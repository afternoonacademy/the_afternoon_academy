import Link from "next/link";

import { addDeliverySeat, openWeeklyTableForDate, recordAttendance, updateDailyDeliverySession } from "@/actions/learners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Session = {
  id: string;
  table_number: number;
  academy_table_id: string;
  starts_at: string;
  duration_minutes: number;
  teacher_name: string | null;
  focus: string | null;
  status: string;
};
type Seat = {
  id: string;
  delivery_session_id: string;
  learner_id: string;
  seat_number: number;
};
type Learner = { id: string; first_name: string; year_group: string | null };
type Attendance = {
  learner_id: string;
  delivery_session_id: string;
  status: string;
};
type AcademyTable = {
  id: string;
  table_number: number;
  name: string;
  seat_capacity: number;
};
type WeeklyTemplate = {
  weekday: number;
  academy_table_id: string;
  table_number: number;
  starts_at: string;
  duration_minutes: number;
  teacher_name: string | null;
  focus: string | null;
  effective_from: string;
  effective_to: string | null;
};

const finishTime = (startsAt: string, minutes: number) => {
  const [hours, minutesPart] = startsAt.slice(0, 5).split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutesPart + minutes)
    .toTimeString()
    .slice(0, 5);
};

function TeachingTable({
  date,
  table,
  session,
  seats,
  learnerById,
  attendance,
  availableLearners,
  weeklyTemplate,
}: {
  date: string;
  table: AcademyTable;
  session?: Session;
  seats: Seat[];
  learnerById: Map<string, Learner>;
  attendance: Attendance[];
  availableLearners: Learner[];
  weeklyTemplate?: WeeklyTemplate;
}) {
  const capacity = table.seat_capacity || 6;
  const sessionSeats = session
    ? seats.filter((seat) => seat.delivery_session_id === session.id)
    : [];
  const attendanceByLearner = new Map(
    attendance
      .filter((item) => item.delivery_session_id === session?.id)
      .map((item) => [item.learner_id, item.status]),
  );
  return (
    <section
      className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm"
      aria-label={table.name || `Table ${table.table_number}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Teaching table {table.table_number}</p>
          <h3 className="font-bold">
            {table.name || `Table ${table.table_number}`}
          </h3>
          <p className="text-xs text-muted-foreground">
            {session ? `${session.teacher_name || "Teacher to assign"} · ${session.focus || "General homework support"}` : weeklyTemplate ? `${weeklyTemplate.teacher_name || "Teacher to assign"} · ${weeklyTemplate.focus || "General homework support"}` : "Session details to confirm"}
          </p>
        </div>
        <span className="rounded-full bg-background px-2 py-1 text-xs font-medium">
          {session ? `${sessionSeats.length}/${capacity} learners` : `0/${capacity} learners`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: capacity }, (_, index) => index + 1).map(
          (seatNumber) => {
            const seat = sessionSeats.find(
              (item) => item.seat_number === seatNumber,
            );
            const learner = seat ? learnerById.get(seat.learner_id) : undefined;
            const status = learner
              ? attendanceByLearner.get(learner.id)
              : undefined;
            return (
              <div
                className={
                  learner
                    ? "min-h-28 rounded-2xl bg-[#26345f] p-3 text-center text-xs text-primary-foreground shadow-sm"
                    : "min-h-28 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-3 text-center text-xs text-indigo-700"
                }
                key={seatNumber}
              >
                {learner ? (
                  <>
                    <Link
                      className="font-semibold hover:underline"
                      href={`/admin/learners/${learner.id}`}
                    >
                      {learner.first_name}
                    </Link>
                    <p className="mt-1 text-[10px] text-indigo-100">
                      {learner.year_group || "Learner"}
                    </p>
                    <div className="mt-2 flex justify-center gap-1">
                      {(["present", "absent"] as const).map((value) => (
                        <form action={recordAttendance} key={value}>
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
                            value={session!.id}
                          />
                          <input name="status" type="hidden" value={value} />
                          <Button
                            aria-label={`${value} ${learner.first_name}`}
                            className="h-7 min-w-12 border-white/70 bg-white px-1 text-[10px] text-[#26345f] hover:bg-[#ffde59]"
                            size="sm"
                            variant={status === value ? "secondary" : "outline"}
                          >
                            {value === "present" ? "Present" : "Absent"}
                          </Button>
                        </form>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Seat {seatNumber}</p>
                    <p className="mt-2 font-semibold">
                      {session ? "Available" : "—"}
                    </p>
                  </>
                )}
              </div>
            );
          },
        )}
      </div>
      {!session && weeklyTemplate ? <form action={openWeeklyTableForDate} className="mt-3"><input name="serviceDate" type="hidden" value={date} /><input name="tableNumber" type="hidden" value={table.table_number} /><input name="startsAt" type="hidden" value={weeklyTemplate.starts_at.slice(0, 5)} /><Button className="w-full" variant="outline">Open this session and add learners</Button></form> : null}
      {session &&
      session.status !== "cancelled" &&
      sessionSeats.length < capacity ? (
        <details className="mt-3 rounded-xl border bg-[#fffdf5] p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Add an ad-hoc learner
          </summary>
          <form
            action={addDeliverySeat}
            className="mt-3 grid gap-2 sm:grid-cols-3"
          >
            <input name="deliverySessionId" type="hidden" value={session.id} />
            <select
              className="h-10 rounded-md border bg-background px-3"
              name="learnerId"
              required
            >
              <option value="">Learner</option>
              {availableLearners.map((learner) => (
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
              <option value="">Available seat</option>
              {Array.from({ length: capacity }, (_, index) => index + 1)
                .filter(
                  (number) =>
                    !sessionSeats.some((seat) => seat.seat_number === number),
                )
                .map((number) => (
                  <option key={number} value={number}>
                    Seat {number}
                  </option>
                ))}
            </select>
            <Button className="min-h-10" disabled={!availableLearners.length}>
              Add learner
            </Button>
          </form>
        </details>
      ) : null}
    </section>
  );
}

export function TodayDeliveryBoard({
  date,
  sessions,
  seats,
  learners,
  attendance,
  tables,
  eligibleLearnerIds,
  weeklyTemplates,
}: {
  date: string;
  sessions: Session[];
  seats: Seat[];
  learners: Learner[];
  attendance: Attendance[];
  tables: AcademyTable[];
  eligibleLearnerIds: string[];
  weeklyTemplates: WeeklyTemplate[];
}) {
  const learnerById = new Map(learners.map((learner) => [learner.id, learner]));
  const availableLearners = learners.filter((learner) =>
    eligibleLearnerIds.includes(learner.id),
  );
  const teachingTables = tables
    .filter((table) => table.table_number === 1 || table.table_number === 2)
    .sort((a, b) => a.table_number - b.table_number);
  const startTimes = [...new Set([...sessions.map((session) => session.starts_at), ...weeklyTemplates.map((template) => template.starts_at)])].sort();
  if (!startTimes.length)
    return (
      <Card className="border-indigo-100">
        <CardHeader><CardTitle>Delivery room</CardTitle><p className="text-sm text-muted-foreground">Both teaching tables stay visible, even when there are no bookings.</p></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">{teachingTables.map((table) => <TeachingTable attendance={attendance} availableLearners={availableLearners} date={date} key={table.id} learnerById={learnerById} seats={seats} table={table} />)}</CardContent>
      </Card>
    );
  return (
    <div className="grid gap-6">
      {startTimes.map((startsAt) => {
        const timeSessions = sessions.filter(
          (session) => session.starts_at === startsAt,
        );
        const templatesAtTime = weeklyTemplates.filter((template) => template.starts_at === startsAt);
        const duration = timeSessions[0]?.duration_minutes || templatesAtTime[0]?.duration_minutes || 50;
        const endAt = finishTime(startsAt, duration);
        return (
          <Card className="overflow-hidden border-indigo-100" key={startsAt}>
            <CardHeader>
              <CardTitle>
                {startsAt.slice(0, 5)}–{endAt} · delivery room
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Stable table cards show each learner’s place and attendance. Empty scheduled sessions remain ready at 0/6.
              </p>
              <div className="mt-3 grid gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 sm:grid-cols-2">{timeSessions.map((session) => <form action={updateDailyDeliverySession} className="grid gap-2 sm:grid-cols-[1fr_auto]" key={session.id}><input name="deliverySessionId" type="hidden" value={session.id} /><input name="serviceDate" type="hidden" value={date} /><input name="tableNumber" type="hidden" value={session.table_number} /><input name="startsAt" type="hidden" value={session.starts_at.slice(0, 5)} /><input name="durationMinutes" type="hidden" value={session.duration_minutes} /><input name="teacherName" type="hidden" value={session.teacher_name || ""} /><label className="text-sm font-semibold">Session type · Table {session.table_number}<select className="mt-1 h-10 w-full rounded-md border bg-white px-3" defaultValue={session.focus || "General homework support"} name="focus"><option>General homework support</option><option>English support</option><option>Spanish support</option><option>Maths support</option><option>Study skills</option><option>Creative learning</option><option>Other</option></select></label><Button className="self-end" size="sm">Save</Button></form>)}</div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-3 text-sm text-indigo-900">
                <span className="font-semibold">Ad-hoc learners:</span> use the control on the relevant table to add any active learner. Waiting and handover space is deliberately not counted as a teaching seat.
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {teachingTables.map((table) => (
                  <TeachingTable
                    attendance={attendance}
                    date={date}
                    availableLearners={availableLearners}
                    key={table.id}
                    learnerById={learnerById}
                    seats={seats}
                    session={timeSessions.find(
                      (session) => session.academy_table_id === table.id,
                    )}
                    table={table}
                    weeklyTemplate={templatesAtTime.find((template) => template.academy_table_id === table.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
