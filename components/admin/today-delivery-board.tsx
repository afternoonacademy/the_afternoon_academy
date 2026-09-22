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
      className="rounded-3xl border-4 border-amber-900 bg-amber-50 p-3 sm:p-4"
      aria-label={table.name || `Table ${table.table_number}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
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
            ? `${sessionSeats.length}/${capacity} booked`
            : "Not running"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
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
                    ? "min-h-24 rounded-full bg-primary p-3 text-center text-xs text-primary-foreground"
                    : "min-h-24 rounded-full border-2 border-emerald-500 bg-emerald-50 p-3 text-center text-xs text-emerald-800"
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
                    <p className="mt-1 text-[10px] opacity-80">
                      {learner.year_group || "Learner"}
                    </p>
                    <div className="mt-2 flex justify-center gap-1">
                      {(["present", "late", "absent"] as const).map((value) => (
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
                            {value === "present"
                              ? "P"
                              : value === "late"
                                ? "L"
                                : "A"}
                          </Button>
                        </form>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p>Seat {seatNumber}</p>
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
        <details className="mt-3 rounded-xl border bg-background p-3">
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
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          No dated delivery sessions are open for this day.
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
          <Card key={startsAt}>
            <CardHeader>
              <CardTitle>
                {startsAt.slice(0, 5)}–{endAt} · TAA1 floor plan
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Two teaching tables · capacity 12. Transition seats are not
                bookable.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-dashed bg-muted/30 p-3">
                <p className="text-sm font-medium">
                  Transition / waiting / activity seats
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((seat) => (
                    <span
                      className="flex size-10 items-center justify-center rounded-full border bg-background text-xs text-muted-foreground"
                      key={seat}
                      title="Not bookable"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Five room seats for handovers, late parents and activities —
                  excluded from teaching capacity.
                </p>
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
