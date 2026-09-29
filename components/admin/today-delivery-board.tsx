import Link from "next/link";

import { addDeliverySeat, recordAttendance } from "@/actions/learners";
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
  eligibleLearners,
}: {
  date: string;
  table: AcademyTable;
  session?: Session;
  seats: Seat[];
  learnerById: Map<string, Learner>;
  attendance: Attendance[];
  eligibleLearners: Learner[];
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
            {session
              ? `${session.teacher_name || "Teacher to assign"} · ${session.focus || "General support"}`
              : "No dated session opened"}
          </p>
        </div>
        <span className="rounded-full bg-background px-2 py-1 text-xs font-medium">
          {session
            ? `${sessionSeats.length}/${capacity} learners`
            : "Not running"}
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
                      {(["present", "late", "absent", "authorised_absence"] as const).map((value) => (
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
                            className="h-7 min-w-7 px-1 text-[10px]"
                            size="sm"
                            variant={status === value ? "secondary" : "outline"}
                          >
                            {value === "present" ? "Present" : value === "late" ? "Late" : value === "absent" ? "Absent" : "Excused"}
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
      {session &&
      session.status !== "cancelled" &&
      sessionSeats.length < capacity ? (
        <details className="mt-3 rounded-xl border bg-[#fffdf5] p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Admin: add last-minute paid booking
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
              <option value="">Paid learner</option>
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
            <Button className="min-h-10" disabled={!eligibleLearners.length}>
              Add booking
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
}: {
  date: string;
  sessions: Session[];
  seats: Seat[];
  learners: Learner[];
  attendance: Attendance[];
  tables: AcademyTable[];
  eligibleLearnerIds: string[];
}) {
  const learnerById = new Map(learners.map((learner) => [learner.id, learner]));
  const eligibleLearners = learners.filter((learner) =>
    eligibleLearnerIds.includes(learner.id),
  );
  const teachingTables = tables
    .filter((table) => table.table_number === 1 || table.table_number === 2)
    .sort((a, b) => a.table_number - b.table_number);
  const startTimes = [
    ...new Set(sessions.map((session) => session.starts_at)),
  ].sort();
  if (!startTimes.length)
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-muted-foreground">
          No delivery sessions are open for this day. A paid placement creates the dated seats teachers need here.
        </CardContent>
      </Card>
    );
  return (
    <div className="grid gap-6">
      {startTimes.map((startsAt) => {
        const timeSessions = sessions.filter(
          (session) => session.starts_at === startsAt,
        );
        const endAt = timeSessions[0]
          ? finishTime(startsAt, timeSessions[0].duration_minutes)
          : "";
        return (
          <Card className="overflow-hidden border-indigo-100" key={startsAt}>
            <CardHeader>
              <CardTitle>
                {startsAt.slice(0, 5)}–{endAt} · delivery room
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Stable table cards show each learner’s place and attendance. Only teaching seats are bookable.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-3 text-sm text-indigo-900">
                <span className="font-semibold">Unassigned today:</span> use the paid-learner control on the relevant table to place a last-minute learner. Waiting and handover space is deliberately not counted as a teaching seat.
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {teachingTables.map((table) => (
                  <TeachingTable
                    attendance={attendance}
                    date={date}
                    eligibleLearners={eligibleLearners}
                    key={table.id}
                    learnerById={learnerById}
                    seats={seats}
                    session={timeSessions.find(
                      (session) => session.academy_table_id === table.id,
                    )}
                    table={table}
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
