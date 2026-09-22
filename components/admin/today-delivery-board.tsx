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
type AcademyTable = { id: string; name: string; seat_capacity: number };

const finishTime = (startsAt: string, minutes: number) => {
  const [hours, minutesPart] = startsAt.slice(0, 5).split(":").map(Number);
  const end = new Date(2000, 0, 1, hours, minutesPart + minutes);
  return end.toTimeString().slice(0, 5);
};

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
  const tableById = new Map(tables.map((table) => [table.id, table]));
  const eligibleLearners = learners.filter((learner) =>
    eligibleLearnerIds.includes(learner.id),
  );

  if (!sessions.length) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          No dated delivery sessions are open for this day.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {sessions.map((session) => {
        const table = tableById.get(session.academy_table_id);
        const capacity = table?.seat_capacity || 6;
        const sessionSeats = seats
          .filter((seat) => seat.delivery_session_id === session.id)
          .sort((a, b) => a.seat_number - b.seat_number);
        const attendanceByLearner = new Map(
          attendance
            .filter((item) => item.delivery_session_id === session.id)
            .map((item) => [item.learner_id, item.status]),
        );

        return (
          <Card key={session.id}>
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>
                  {session.starts_at.slice(0, 5)}–
                  {finishTime(session.starts_at, session.duration_minutes)}
                </CardTitle>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                  {sessionSeats.length}/{capacity} booked
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {table?.name || `Table ${session.table_number}`} ·{" "}
                {session.teacher_name || "Teacher to assign"} ·{" "}
                {session.focus || "General support"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.status === "cancelled" ? (
                <p className="rounded-md border p-3 text-sm">
                  This session is cancelled.
                </p>
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from(
                      { length: capacity },
                      (_, index) => index + 1,
                    ).map((seatNumber) => {
                      const seat = sessionSeats.find(
                        (item) => item.seat_number === seatNumber,
                      );
                      const learner = seat
                        ? learnerById.get(seat.learner_id)
                        : undefined;
                      const status = learner
                        ? attendanceByLearner.get(learner.id)
                        : undefined;
                      return (
                        <div className="rounded-xl border p-3" key={seatNumber}>
                          {learner ? (
                            <>
                              <Link
                                className="font-semibold hover:underline"
                                href={`/admin/learners/${learner.id}`}
                              >
                                {seatNumber}. {learner.first_name}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {learner.year_group ||
                                  "Year group not recorded"}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(["present", "late", "absent"] as const).map(
                                  (value) => (
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
                                        value={session.id}
                                      />
                                      <input
                                        name="status"
                                        type="hidden"
                                        value={value}
                                      />
                                      <Button
                                        className="min-h-10 text-xs"
                                        size="sm"
                                        variant={
                                          status === value
                                            ? "default"
                                            : "outline"
                                        }
                                      >
                                        {value === "present"
                                          ? "Present"
                                          : value === "late"
                                            ? "Late"
                                            : "Absent"}
                                      </Button>
                                    </form>
                                  ),
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {seatNumber}. Available
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {sessionSeats.length < capacity ? (
                    <details className="rounded-lg border p-3">
                      <summary className="cursor-pointer font-medium">
                        Admin: add a last-minute booking
                      </summary>
                      <form
                        action={addDeliverySeat}
                        className="mt-3 grid gap-2 sm:grid-cols-3"
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
                          {Array.from(
                            { length: capacity },
                            (_, index) => index + 1,
                          )
                            .filter(
                              (number) =>
                                !sessionSeats.some(
                                  (seat) => seat.seat_number === number,
                                ),
                            )
                            .map((number) => (
                              <option key={number} value={number}>
                                Seat {number}
                              </option>
                            ))}
                        </select>
                        <Button
                          className="min-h-10"
                          disabled={!eligibleLearners.length}
                        >
                          Add booking
                        </Button>
                      </form>
                    </details>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
