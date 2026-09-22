"use client";

import { useMemo, useState } from "react";

import {
  addDeliverySeat,
  cancelDeliverySession,
  openWeeklyTableForDate,
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
type Table = { table_number: number; name: string | null };
type WeeklyTemplate = {
  weekday: number;
  table_number: number;
  starts_at: string;
  teacher_name: string | null;
  focus: string | null;
  effective_from: string;
  effective_to: string | null;
};

export function DailyDeliveryBoard({
  date,
  sessions,
  seats,
  learners,
  attendance,
  eligibleLearnerIds,
  tables,
  weeklyTemplates,
  weekday,
}: {
  date: string;
  sessions: Session[];
  seats: Seat[];
  learners: Learner[];
  attendance: Attendance[];
  eligibleLearnerIds: string[];
  tables: Table[];
  weeklyTemplates: WeeklyTemplate[];
  weekday: number;
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
  const availableTables = useMemo(() => {
    const configured = tables.filter((table) => table.table_number > 0);
    return configured.length > 0
      ? configured
      : [1, 2].map((table_number) => ({ table_number, name: null }));
  }, [tables]);
  const [selectedTable, setSelectedTable] = useState(
    sortedSessions[0]?.table_number ?? availableTables[0]?.table_number ?? 1,
  );
  const [sessionId, setSessionId] = useState(sortedSessions[0]?.id ?? "");
  const selected = sortedSessions.find(
    (session) =>
      session.id === sessionId && session.table_number === selectedTable,
  );
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
  const slots = sortedSessions.filter(
    (session) => session.table_number === selectedTable,
  );
  const selectedTableName = availableTables.find(
    (table) => table.table_number === selectedTable,
  )?.name;
  const weeklyTemplate = weeklyTemplates
    .filter(
      (template) =>
        template.weekday === weekday &&
        template.table_number === selectedTable &&
        template.effective_from <= date &&
        (!template.effective_to || template.effective_to >= date),
    )
    .sort(
      (a, b) =>
        a.starts_at.localeCompare(b.starts_at) ||
        b.effective_from.localeCompare(a.effective_from),
    )[0];

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Daily delivery</CardTitle>
        <div className="flex flex-wrap gap-2" aria-label="Choose table">
          {availableTables.map((table) => (
            <Button
              key={table.table_number}
              onClick={() => {
                setSelectedTable(table.table_number);
                setSessionId(
                  sortedSessions.find(
                    (session) => session.table_number === table.table_number,
                  )?.id ?? "",
                );
              }}
              size="sm"
              type="button"
              variant={
                table.table_number === selectedTable ? "default" : "outline"
              }
            >
              {table.name || `Table ${table.table_number}`}
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
              variant={slot.id === selected?.id ? "default" : "outline"}
            >
              {slot.starts_at.slice(0, 5)}
            </Button>
          ))}
        </div>
        <p className="text-sm font-normal text-muted-foreground">
          {selected
            ? `${selectedTableName || `Table ${selected.table_number}`} · ${selected.starts_at.slice(0, 5)} · ${selected.teacher_name || "Teacher to confirm"} · ${selected.focus || "General support"}`
            : `${selectedTableName || `Table ${selectedTable}`} · no dated session`}
        </p>
      </CardHeader>
      <CardContent>
        {!selected ? (
          <div className="space-y-3 rounded-md border p-4 text-sm">
            {weeklyTemplate ? (
              <>
                <p className="font-medium">Weekly default ready</p>
                <p className="text-muted-foreground">
                  {weeklyTemplate.starts_at.slice(0, 5)} ·{" "}
                  {weeklyTemplate.teacher_name || "Teacher to confirm"} ·{" "}
                  {weeklyTemplate.focus || "General support"}
                </p>
                <form action={openWeeklyTableForDate}>
                  <input name="serviceDate" type="hidden" value={date} />
                  <input
                    name="tableNumber"
                    type="hidden"
                    value={selectedTable}
                  />
                  <Button className="min-h-11">
                    Open this table for today
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-muted-foreground">
                There is no weekly default or dated session for this table on
                this day. Set its weekly plan before opening a delivery board.
              </p>
            )}
          </div>
        ) : selected.status === "cancelled" ? (
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
