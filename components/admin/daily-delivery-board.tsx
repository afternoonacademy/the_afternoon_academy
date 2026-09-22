"use client";

import { useMemo, useState } from "react";

import {
  addDeliverySeat,
  cancelDeliverySession,
  recordAttendance,
  removeDeliverySeat,
} from "@/actions/learners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Session = {
  id: string;
  table_number: number;
  starts_at: string;
  teacher_name: string | null;
  focus: string | null;
  status: string;
};
type Seat = {
  id: string;
  delivery_session_id: string;
  learner_id: string;
  seat_number: number;
  status: string;
};
type Learner = { id: string; first_name: string; year_group: string | null };
type Attendance = {
  learner_id: string;
  delivery_session_id: string;
  status: string;
};

export function DailyDeliveryBoard({
  date,
  sessions,
  seats,
  learners,
  attendance,
  eligibleLearnerIds,
}: {
  date: string;
  sessions: Session[];
  seats: Seat[];
  learners: Learner[];
  attendance: Attendance[];
  eligibleLearnerIds: string[];
}) {
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          a.table_number - b.table_number ||
          a.starts_at.localeCompare(b.starts_at),
      ),
    [sessions],
  );
  const [sessionId, setSessionId] = useState(sortedSessions[0]?.id ?? "");
  const selected =
    sortedSessions.find((session) => session.id === sessionId) ??
    sortedSessions[0];
  const selectedSeats = useMemo(
    () =>
      seats.filter(
        (seat) =>
          seat.delivery_session_id === selected?.id &&
          seat.status === "scheduled",
      ),
    [seats, selected?.id],
  );
  const learnerById = useMemo(
    () => new Map(learners.map((learner) => [learner.id, learner])),
    [learners],
  );
  const attendanceByLearner = useMemo(
    () =>
      new Map(
        attendance
          .filter((item) => item.delivery_session_id === selected?.id)
          .map((item) => [item.learner_id, item.status]),
      ),
    [attendance, selected?.id],
  );
  const eligibleLearners = learners.filter((learner) =>
    eligibleLearnerIds.includes(learner.id),
  );
  const tables = [
    ...new Set(sortedSessions.map((session) => session.table_number)),
  ];
  const selectedTable = selected?.table_number ?? tables[0];
  const slots = sortedSessions.filter(
    (session) => session.table_number === selectedTable,
  );

  if (!selected)
    return (
      <Card>
        <CardHeader>
          <CardTitle>No dated session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No delivery session is open for this date.
          </p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Daily delivery</CardTitle>
        <div className="flex flex-wrap gap-2" aria-label="Choose table">
          {tables.map((table) => (
            <Button
              key={table}
              onClick={() =>
                setSessionId(
                  sortedSessions.find(
                    (session) => session.table_number === table,
                  )?.id ?? selected.id,
                )
              }
              size="sm"
              type="button"
              variant={table === selectedTable ? "default" : "outline"}
            >
              Table {table}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Choose session time">
          {slots.map((slot) => (
            <Button
              key={slot.id}
              onClick={() => setSessionId(slot.id)}
              size="sm"
              type="button"
              variant={slot.id === selected.id ? "default" : "outline"}
            >
              {slot.starts_at.slice(0, 5)}
            </Button>
          ))}
        </div>
        <p className="text-sm font-normal text-muted-foreground">
          Table {selected.table_number} · {selected.starts_at.slice(0, 5)} ·{" "}
          {selected.teacher_name || "Teacher to confirm"} ·{" "}
          {selected.focus || "General support"}
        </p>
      </CardHeader>
      <CardContent>
        {selected.status === "cancelled" ? (
          <p className="rounded-md border p-3 text-sm">
            This session is cancelled.
          </p>
        ) : (
          <>
            <div className="mx-auto grid max-w-md grid-cols-3 gap-3 rounded-[2rem] border-8 border-amber-900 bg-amber-100 p-4 sm:p-6">
              {[1, 2, 3, 4, 5, 6].map((number) => {
                const seat = selectedSeats.find(
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
                        <p className="font-semibold">{learner.first_name}</p>
                        <form action={recordAttendance} className="mt-2">
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
                            value={selected.id}
                          />
                          <input name="status" type="hidden" value="present" />
                          <Button
                            className="h-8 text-xs"
                            disabled={
                              attendanceByLearner.get(learner.id) === "present"
                            }
                            size="sm"
                          >
                            {attendanceByLearner.get(learner.id) === "present"
                              ? "✓"
                              : "Present"}
                          </Button>
                        </form>
                        <form action={removeDeliverySeat} className="mt-1">
                          <input
                            name="deliverySeatId"
                            type="hidden"
                            value={seat!.id}
                          />
                          <Button
                            className="h-7 text-xs"
                            size="sm"
                            type="submit"
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
                value={selected.id}
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
                {[1, 2, 3, 4, 5, 6].map((number) => (
                  <option key={number} value={number}>
                    {number}
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
                value={selected.id}
              />
              <Button type="submit" variant="outline">
                Cancel this session
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
