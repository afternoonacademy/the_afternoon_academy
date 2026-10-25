"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  addAdhocDeliverySeat,
  addDeliverySeat,
  recordAttendance,
  recordRenewalExpectedAttendance,
  saveDeliverySeatTeachingTime,
  saveAdhocDeliverySession,
  updateDailyDeliverySession,
} from "@/actions/learners";
import { InfoTip } from "@/components/admin/info-tip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RenewalExpectedSeat } from "@/lib/admin/operations-renewal-expectations";
import type { PlannedExpectedSeat } from "@/lib/admin/operations-planned-expectations";

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
type StandingPlace = { learner_id: string; academy_table_id: string; seat_number: number | null; starts_at: string; duration_minutes: number };
type TimeOverride = { delivery_seat_id: string; actual_starts_at: string | null; time_tbc: boolean };
type Seat = {
  id: string;
  delivery_session_id: string;
  learner_id: string;
  seat_number: number;
  status: string;
};
type Learner = {
  id: string;
  first_name: string;
  year_group: string | null;
};
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
  academy_table_id: string;
  table_number: number;
  starts_at: string;
  duration_minutes: number;
  teacher_name: string | null;
  focus: string | null;
};

const types = [
  "General homework support",
  "English support",
  "Spanish support",
  "Maths support",
  "Study skills",
  "Creative learning",
  "Other",
];
const standardTimes = ["17:00", "18:00"];

const finishTime = (start: string, minutes: number) => {
  const [hour, minute] = start.slice(0, 5).split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute + minutes)
    .toTimeString()
    .slice(0, 5);
};

function TableCard({
  date,
  table,
  sessions,
  templates,
  seats,
  expectedRenewalSeats,
  expectedPlannedSeats,
  standingPlaces,
  timeOverrides,
  learners,
  attendance,
}: {
  date: string;
  table: AcademyTable;
  sessions: Session[];
  templates: WeeklyTemplate[];
  seats: Seat[];
  expectedRenewalSeats: RenewalExpectedSeat[];
  expectedPlannedSeats: PlannedExpectedSeat[];
  standingPlaces: StandingPlace[];
  timeOverrides: TimeOverride[];
  learners: Learner[];
  attendance: Attendance[];
}) {
  // A one-off delivery time must never create a new Academy-wide selector.
  const times = useMemo(() => [...new Set([...standardTimes, ...templates.map((t) => t.starts_at.slice(0, 5))])].sort(), [templates]);
  const [time, setTime] = useState("17:00");
  const placeForSeat = (seat: Seat) => standingPlaces.find((place) =>
    place.learner_id === seat.learner_id && place.academy_table_id === table.id && place.seat_number === seat.seat_number);
  const allocatedTime = (seat: Seat) => placeForSeat(seat)?.starts_at.slice(0, 5) ||
    (standardTimes.includes(sessions.find((session) => session.id === seat.delivery_session_id)?.starts_at.slice(0, 5) || "")
      ? sessions.find((session) => session.id === seat.delivery_session_id)!.starts_at.slice(0, 5) : standardTimes[0]);
  const session = sessions.find((item) => item.starts_at.slice(0, 5) === time);
  const template = templates.find((item) => item.starts_at.slice(0, 5) === time);
  const renewalSeats = expectedRenewalSeats.filter((item) => item.startsAt === time);
  const plannedSeats = expectedPlannedSeats.filter((item) => item.startsAt === time);
  const capacity = table.seat_capacity || 6;
  const sessionSeats = seats.filter((seat) =>
    sessions.some((item) => item.id === seat.delivery_session_id) && allocatedTime(seat) === time);
  const attendanceSessionId = (seat: Seat) => seat.delivery_session_id;
  const learnerById = new Map(
    learners.map((learner) => [learner.id, learner]),
  );
  const attendanceByLearner = new Map(
    attendance
      .filter((item) => sessionSeats.some((seat) => seat.delivery_session_id === item.delivery_session_id))
      .map((item) => [item.learner_id, item.status]),
  );
  const duration =
    session?.duration_minutes ||
    template?.duration_minutes ||
    renewalSeats[0]?.durationMinutes ||
    plannedSeats[0]?.durationMinutes ||
    50;
  const focus =
    session?.focus ||
    template?.focus ||
    renewalSeats[0]?.focus ||
    plannedSeats[0]?.focus ||
    "General homework support";
  const occupiedSeatNumbers = new Set([
    ...sessionSeats.map((seat) => seat.seat_number),
    ...renewalSeats.map((seat) => seat.seatNumber),
    ...plannedSeats.map((seat) => seat.seatNumber),
  ]);
  const availableSeats = Array.from(
    { length: capacity },
    (_, index) => index + 1,
  ).filter((number) => !occupiedSeatNumbers.has(number));
  const sessionAction = session
    ? updateDailyDeliverySession
    : saveAdhocDeliverySession;
  const expectedCount = new Set([
    ...sessionSeats.map((seat) => "learner:" + seat.learner_id),
    ...renewalSeats.map((seat) => "learner:" + seat.learnerId),
    ...plannedSeats.map((seat) => "lead:" + seat.childLeadId),
  ]).size;

  return (
    <section className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            Teaching table {table.table_number}
          </p>
          <h3 className="font-bold">
            {table.name || `Table ${table.table_number}`}
          </h3>
        </div>
        <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-800">
          {expectedCount}/{capacity}
        </span>
      </div>

      <div
        className="mt-3 flex flex-wrap gap-2"
        aria-label={`${table.name} session time`}
      >
        {times.map((item) => (
          <Button
            key={item}
            onClick={() => setTime(item)}
            size="sm"
            type="button"
            variant={item === time ? "default" : "outline"}
          >
            {item.slice(0, 5)}–
            {finishTime(item, item === time ? duration : 50)}
          </Button>
        ))}
      </div>

      <form action={sessionAction} className="mt-3 flex gap-2">
        <input name="serviceDate" type="hidden" value={date} />
        <input name="academyTableId" type="hidden" value={table.id} />
        <input name="tableNumber" type="hidden" value={table.table_number} />
        <input name="startsAt" type="hidden" value={time.slice(0, 5)} />
        <input name="durationMinutes" type="hidden" value={duration} />
        {session ? (
          <>
            <input name="deliverySessionId" type="hidden" value={session.id} />
            <input
              name="teacherName"
              type="hidden"
              value={session.teacher_name || ""}
            />
          </>
        ) : null}
        <label className="sr-only">Session type</label>
        <select
          className="h-9 min-w-0 flex-1 rounded-md border bg-white px-2 text-sm"
          defaultValue={focus}
          name="focus"
        >
          {types.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <Button size="sm">Save type</Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        {session?.teacher_name ||
          template?.teacher_name ||
          renewalSeats[0]?.teacherName ||
          "Teacher to assign"}{" "}
        ·{" "}
        {renewalSeats.length
          ? "renewal-due learners remain expected until their recurring place is released"
          : plannedSeats.length
            ? "planned lead places remain held while payment is pending"
            : session
              ? "dated session"
              : "ready when a learner is added"}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: capacity }, (_, index) => index + 1).map(
          (seatNumber) => {
            const seat = sessionSeats.find(
              (item) => item.seat_number === seatNumber,
            );
            const renewalSeat = renewalSeats.find(
              (item) => item.seatNumber === seatNumber,
            );
            const plannedSeat = plannedSeats.find(
              (item) => item.seatNumber === seatNumber,
            );
            const learnerId = seat?.learner_id || renewalSeat?.learnerId;
            const learner = learnerId
              ? learnerById.get(learnerId)
              : undefined;
            const status = learner
              ? attendanceByLearner.get(learner.id)
              : undefined;
            const renewalDue = Boolean(renewalSeat && !seat);
            const plannedOnly = Boolean(plannedSeat && !seat && !renewalSeat);
            const occupied = Boolean(learner || plannedOnly);

            return (
              <div
                className={
                  occupied
                    ? plannedOnly
                      ? "min-h-28 rounded-2xl bg-sky-700 p-3 text-center text-xs text-white shadow-sm"
                      : renewalDue || seat?.status === "payment_pending"
                        ? "min-h-28 rounded-2xl bg-amber-700 p-3 text-center text-xs text-white shadow-sm"
                        : "min-h-28 rounded-2xl bg-[#26345f] p-3 text-center text-xs text-white shadow-sm"
                    : "min-h-28 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-3 text-center text-xs text-indigo-700"
                }
                key={seatNumber}
              >
                {plannedOnly && plannedSeat ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">
                      Seat {seatNumber}
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {plannedSeat.childName}
                    </p>
                    <p className="mt-1 text-[10px] text-sky-100">
                      {plannedSeat.yearGroup
                        ? String(plannedSeat.yearGroup)
                        : "Year group not recorded"}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-sky-100">
                      Planned · awaiting payment
                    </p>
                  </>
                ) : learner ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">
                      Seat {seatNumber}
                    </p>
                    <Link
                      className="mt-1 block font-semibold text-white hover:underline"
                      href={`/admin/learners/${learner.id}`}
                    >
                      {learner.first_name}
                    </Link>
                    <p className="mt-1 text-[10px] text-indigo-100">
                      {learner.year_group
                        ? `Year ${String(learner.year_group).replace(/^Year\s*/i, "")}`
                        : "Year group not recorded"}
                    </p>
                    {renewalDue ? (
                      <p className="mt-1 text-[10px] font-bold text-amber-100">
                        Renewal due · place held
                      </p>
                    ) : seat?.status === "payment_pending" ? (
                      <p className="mt-1 text-[10px] font-bold text-amber-100">
                        Payment pending
                      </p>
                    ) : null}

                    {seat ? (() => {
                      const delivery = sessions.find((item) => item.id === seat.delivery_session_id);
                      const override = timeOverrides.find((item) => item.delivery_seat_id === seat.id);
                      const original = allocatedTime(seat);
                      const actual = override?.actual_starts_at?.slice(0, 5) || delivery?.starts_at.slice(0, 5) || original;
                      const different = actual !== original || override?.time_tbc;
                      return (
                        <details className={`mt-2 rounded-lg px-2 py-1 ${different ? "bg-amber-200 text-amber-950" : "bg-white/10 text-white"}`}>
                          <summary className="cursor-pointer text-[11px] font-semibold">{override?.time_tbc ? "Time TBC" : `${actual}–${finishTime(actual, delivery?.duration_minutes || 50)}`}{different ? " · One-off" : ""}</summary>
                          <form action={saveDeliverySeatTeachingTime} className="mt-2 space-y-1 text-left">
                            <input type="hidden" name="deliverySeatId" value={seat.id} />
                            <input type="hidden" name="serviceDate" value={date} />
                            <label className="block text-[10px]">Allocated: {original}</label>
                            <select name="timeStatus" defaultValue={override?.time_tbc ? "tbc" : actual !== original ? "different" : "standard"} className="w-full rounded border px-1 py-1 text-xs text-slate-900">
                              <option value="standard">Original time</option>
                              <option value="different">Different time</option>
                              <option value="tbc">Time TBC</option>
                            </select>
                            <input type="time" name="actualStartsAt" defaultValue={actual} className="w-full rounded border px-1 py-1 text-xs text-slate-900" />
                            <Button size="sm" className="w-full bg-white text-slate-900 hover:bg-amber-100">Save time</Button>
                          </form>
                        </details>
                      );
                    })() : null}
                    <div className="mt-2 flex justify-center gap-1">
                      {(["present", "absent"] as const).map((value) =>
                        renewalDue && renewalSeat ? (
                          <form
                            action={recordRenewalExpectedAttendance}
                            key={value}
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
                              name="placementId"
                              type="hidden"
                              value={renewalSeat.placementId}
                            />
                            <input
                              name="academyTableId"
                              type="hidden"
                              value={renewalSeat.academyTableId}
                            />
                            <input
                              name="tableNumber"
                              type="hidden"
                              value={renewalSeat.tableNumber}
                            />
                            <input
                              name="startsAt"
                              type="hidden"
                              value={renewalSeat.startsAt}
                            />
                            <input
                              name="durationMinutes"
                              type="hidden"
                              value={renewalSeat.durationMinutes}
                            />
                            <input
                              name="teacherName"
                              type="hidden"
                              value={renewalSeat.teacherName || ""}
                            />
                            <input
                              name="focus"
                              type="hidden"
                              value={renewalSeat.focus || ""}
                            />
                            <input name="status" type="hidden" value={value} />
                            <Button
                              className="h-7 min-w-12 border-white/70 bg-white px-1 text-[10px] text-[#26345f] hover:bg-[#ffde59]"
                              size="sm"
                              variant={status === value ? "secondary" : "outline"}
                            >
                              {value === "present" ? "Present" : "Absent"}
                            </Button>
                          </form>
                        ) : (
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
                              value={seat!.delivery_session_id}
                            />
                            <input name="status" type="hidden" value={value} />
                            <Button
                              className="h-7 min-w-12 border-white/70 bg-white px-1 text-[10px] text-[#26345f] hover:bg-[#ffde59]"
                              size="sm"
                              variant={status === value ? "secondary" : "outline"}
                            >
                              {value === "present" ? "Present" : "Absent"}
                            </Button>
                          </form>
                        ),
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Seat {seatNumber}</p>
                    <p className="mt-2 font-semibold">Available</p>
                  </>
                )}
              </div>
            );
          },
        )}
      </div>

      <details className="mt-3 rounded-xl border bg-[#fffdf5] p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Add learner
        </summary>
        <form
          action={session ? addDeliverySeat : addAdhocDeliverySeat}
          className="mt-3 grid gap-2 sm:grid-cols-3"
        >
          {session ? (
            <input
              name="deliverySessionId"
              type="hidden"
              value={session.id}
            />
          ) : (
            <>
              <input name="serviceDate" type="hidden" value={date} />
              <input name="academyTableId" type="hidden" value={table.id} />
              <input
                name="tableNumber"
                type="hidden"
                value={table.table_number}
              />
              <input
                name="startsAt"
                type="hidden"
                value={time.slice(0, 5)}
              />
              <input
                name="durationMinutes"
                type="hidden"
                value={duration}
              />
              <input name="focus" type="hidden" value={focus} />
            </>
          )}
          <select
            className="h-10 rounded-md border bg-white px-3"
            name="learnerId"
            required
          >
            <option value="">Learner</option>
            {learners.map((learner) => (
              <option key={learner.id} value={learner.id}>
                {learner.first_name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-white px-3"
            name="seatNumber"
            required
          >
            <option value="">Seat</option>
            {availableSeats.map((number) => (
              <option key={number} value={number}>
                Seat {number}
              </option>
            ))}
          </select>
          <Button disabled={!learners.length || !availableSeats.length}>
            Add learner
          </Button>
        </form>
      </details>
    </section>
  );
}

export function TodayDeliveryBoard({
  date,
  sessions,
  seats,
  expectedRenewalSeats,
  expectedPlannedSeats,
  learners,
  attendance,
  tables,
  weeklyTemplates,
  standingPlaces,
  timeOverrides,
}: {
  date: string;
  sessions: Session[];
  seats: Seat[];
  expectedRenewalSeats: RenewalExpectedSeat[];
  expectedPlannedSeats: PlannedExpectedSeat[];
  learners: Learner[];
  attendance: Attendance[];
  tables: AcademyTable[];
  eligibleLearnerIds: string[];
  weeklyTemplates: WeeklyTemplate[];
  standingPlaces: StandingPlace[];
  timeOverrides: TimeOverride[];
}) {
  const teachingTables = tables
    .filter((table) => table.table_number > 0)
    .sort((a, b) => a.table_number - b.table_number);

  return (
    <Card className="overflow-hidden border-indigo-100">
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <CardTitle>Delivery room</CardTitle>
          <InfoTip label="About the Delivery room">
            Paid learners, renewal-due recurring learners and planned lead
            places all appear in the room plan. Planned and renewal-held places
            count against capacity until they are paid or deliberately released.
          </InfoTip>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {teachingTables.map((table) => (
          <TableCard
            attendance={attendance}
            date={date}
            expectedRenewalSeats={expectedRenewalSeats.filter(
              (seat) => seat.academyTableId === table.id,
            )}
            expectedPlannedSeats={expectedPlannedSeats.filter(
              (seat) => seat.academyTableId === table.id,
            )}
            key={table.id}
            learners={learners}
            seats={seats}
            standingPlaces={standingPlaces.filter((place) => place.academy_table_id === table.id)}
            timeOverrides={timeOverrides}
            sessions={sessions.filter(
              (session) => session.academy_table_id === table.id,
            )}
            table={table}
            templates={weeklyTemplates.filter(
              (template) => template.academy_table_id === table.id,
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}
