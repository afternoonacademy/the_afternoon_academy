"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { addAdhocDeliverySeat, addDeliverySeat, recordAttendance, saveAdhocDeliverySession, updateDailyDeliverySession } from "@/actions/learners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Session = { id: string; table_number: number; academy_table_id: string; starts_at: string; duration_minutes: number; teacher_name: string | null; focus: string | null; status: string };
type Seat = { id: string; delivery_session_id: string; learner_id: string; seat_number: number; status: string };
type Learner = { id: string; first_name: string; year_group: string | null };
type Attendance = { learner_id: string; delivery_session_id: string; status: string };
type AcademyTable = { id: string; table_number: number; name: string; seat_capacity: number };
type WeeklyTemplate = { academy_table_id: string; table_number: number; starts_at: string; duration_minutes: number; teacher_name: string | null; focus: string | null };

const types = ["General homework support", "English support", "Spanish support", "Maths support", "Study skills", "Creative learning", "Other"];
const standardTimes = ["17:00", "18:00"];
const finishTime = (start: string, minutes: number) => { const [hour, minute] = start.slice(0, 5).split(":").map(Number); return new Date(2000, 0, 1, hour, minute + minutes).toTimeString().slice(0, 5); };

function TableCard({ date, table, sessions, templates, seats, learners, attendance }: { date: string; table: AcademyTable; sessions: Session[]; templates: WeeklyTemplate[]; seats: Seat[]; learners: Learner[]; attendance: Attendance[] }) {
  const times = useMemo(() => [...new Set([...standardTimes, ...sessions.map((session) => session.starts_at.slice(0, 5)), ...templates.map((template) => template.starts_at.slice(0, 5))])].sort(), [sessions, templates]);
  const [time, setTime] = useState(times[0]);
  const session = sessions.find((item) => item.starts_at.slice(0, 5) === time);
  const template = templates.find((item) => item.starts_at.slice(0, 5) === time);
  const capacity = table.seat_capacity || 6;
  const sessionSeats = session ? seats.filter((seat) => seat.delivery_session_id === session.id) : [];
  const learnerById = new Map(learners.map((learner) => [learner.id, learner]));
  const attendanceByLearner = new Map(attendance.filter((item) => item.delivery_session_id === session?.id).map((item) => [item.learner_id, item.status]));
  const duration = session?.duration_minutes || template?.duration_minutes || 50;
  const focus = session?.focus || template?.focus || "General homework support";
  const availableSeats = Array.from({ length: capacity }, (_, index) => index + 1).filter((number) => !sessionSeats.some((seat) => seat.seat_number === number));
  const sessionAction = session ? updateDailyDeliverySession : saveAdhocDeliverySession;

  return <section className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Teaching table {table.table_number}</p><h3 className="font-bold">{table.name || `Table ${table.table_number}`}</h3></div><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-800">{sessionSeats.length}/{capacity}</span></div>
    <div className="mt-3 flex flex-wrap gap-2" aria-label={`${table.name} session time`}>{times.map((item) => <Button key={item} onClick={() => setTime(item)} size="sm" type="button" variant={item === time ? "default" : "outline"}>{item.slice(0, 5)}–{finishTime(item, item === time ? duration : 50)}</Button>)}</div>
    <form action={sessionAction} className="mt-3 flex gap-2"><input name="serviceDate" type="hidden" value={date} /><input name="academyTableId" type="hidden" value={table.id} /><input name="tableNumber" type="hidden" value={table.table_number} /><input name="startsAt" type="hidden" value={time.slice(0, 5)} /><input name="durationMinutes" type="hidden" value={duration} />{session ? <><input name="deliverySessionId" type="hidden" value={session.id} /><input name="teacherName" type="hidden" value={session.teacher_name || ""} /></> : null}<label className="sr-only">Session type</label><select className="h-9 min-w-0 flex-1 rounded-md border bg-white px-2 text-sm" defaultValue={focus} name="focus">{types.map((type) => <option key={type}>{type}</option>)}</select><Button size="sm">Save type</Button></form>
    <p className="mt-2 text-xs text-muted-foreground">{session?.teacher_name || template?.teacher_name || "Teacher to assign"} · {session ? "dated session" : "ready when a learner is added"}</p>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{Array.from({ length: capacity }, (_, index) => index + 1).map((seatNumber) => { const seat = sessionSeats.find((item) => item.seat_number === seatNumber); const learner = seat ? learnerById.get(seat.learner_id) : undefined; const status = learner ? attendanceByLearner.get(learner.id) : undefined; return <div className={learner ? seat?.status === "payment_pending" ? "min-h-28 rounded-2xl bg-amber-700 p-3 text-center text-xs text-white shadow-sm" : "min-h-28 rounded-2xl bg-[#26345f] p-3 text-center text-xs text-white shadow-sm" : "min-h-28 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-3 text-center text-xs text-indigo-700"} key={seatNumber}>{learner ? <><Link className="font-semibold text-white hover:underline" href={`/admin/learners/${learner.id}`}>{learner.first_name}</Link><p className="mt-1 text-[10px] text-indigo-100">{learner.year_group || "Learner"}</p>{seat?.status === "payment_pending" ? <p className="mt-1 text-[10px] font-bold text-amber-100">Payment pending</p> : null}<div className="mt-2 flex justify-center gap-1">{(["present", "absent"] as const).map((value) => <form action={recordAttendance} key={value}><input name="learnerId" type="hidden" value={learner.id} /><input name="attendanceDate" type="hidden" value={date} /><input name="deliverySessionId" type="hidden" value={session!.id} /><input name="status" type="hidden" value={value} /><Button className="h-7 min-w-12 border-white/70 bg-white px-1 text-[10px] text-[#26345f] hover:bg-[#ffde59]" size="sm" variant={status === value ? "secondary" : "outline"}>{value === "present" ? "Present" : "Absent"}</Button></form>)}</div></> : <><p className="font-semibold">Seat {seatNumber}</p><p className="mt-2 font-semibold">Available</p></>}</div> })}</div>
    <details className="mt-3 rounded-xl border bg-[#fffdf5] p-3"><summary className="cursor-pointer text-sm font-medium">Add learner</summary><form action={session ? addDeliverySeat : addAdhocDeliverySeat} className="mt-3 grid gap-2 sm:grid-cols-3">{session ? <input name="deliverySessionId" type="hidden" value={session.id} /> : <><input name="serviceDate" type="hidden" value={date} /><input name="academyTableId" type="hidden" value={table.id} /><input name="tableNumber" type="hidden" value={table.table_number} /><input name="startsAt" type="hidden" value={time.slice(0, 5)} /><input name="durationMinutes" type="hidden" value={duration} /><input name="focus" type="hidden" value={focus} /></>}<select className="h-10 rounded-md border bg-white px-3" name="learnerId" required><option value="">Learner</option>{learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.first_name}</option>)}</select><select className="h-10 rounded-md border bg-white px-3" name="seatNumber" required><option value="">Seat</option>{availableSeats.map((number) => <option key={number} value={number}>Seat {number}</option>)}</select><Button disabled={!learners.length || !availableSeats.length}>Add learner</Button></form></details>
  </section>;
}

export function TodayDeliveryBoard({ date, sessions, seats, learners, attendance, tables, weeklyTemplates }: { date: string; sessions: Session[]; seats: Seat[]; learners: Learner[]; attendance: Attendance[]; tables: AcademyTable[]; eligibleLearnerIds: string[]; weeklyTemplates: WeeklyTemplate[] }) {
  const teachingTables = tables.filter((table) => table.table_number > 0).sort((a, b) => a.table_number - b.table_number);
  return <Card className="overflow-hidden border-indigo-100"><CardHeader><CardTitle>Delivery room</CardTitle><p className="text-sm text-muted-foreground">Each table has its own time and session type. Change one without affecting another.</p></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2">{teachingTables.map((table) => <TableCard attendance={attendance} date={date} key={table.id} learners={learners} seats={seats} sessions={sessions.filter((session) => session.academy_table_id === table.id)} table={table} templates={weeklyTemplates.filter((template) => template.academy_table_id === table.id)} />)}</CardContent></Card>;
}
