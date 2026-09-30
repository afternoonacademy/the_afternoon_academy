import { createTutorRoomBooking } from "@/actions/learners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function TutorRoomPage() {
  const [{ data: learners }, { data: leads }, { data: bookings }] =
    await Promise.all([
      supabaseAdmin
        .from("learners")
        .select("id, first_name")
        .eq("status", "active")
        .order("first_name"),
      supabaseAdmin
        .from("parent_leads")
        .select("id, parent_name")
        .not("status", "in", '("closed")')
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("tutor_room_bookings")
        .select("id, teacher_name, starts_at, ends_at, note")
        .gte("ends_at", new Date().toISOString())
        .order("starts_at")
        .limit(24),
    ]);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-sm text-muted-foreground">One-to-one delivery</p>
        <h2 className="text-3xl font-bold">Tutor Room</h2>
        <p className="mt-1 text-muted-foreground">
          A separate bookable room. It does not consume TAA1’s 12 group-table
          seats.
        </p>
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
            <Input name="note" placeholder="Booking note (optional)" />
            <Button className="min-h-11 sm:col-span-2">Book Tutor Room</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(bookings || []).length ? (
            (bookings || []).map((booking) => (
              <div className="rounded-lg border p-3 text-sm" key={booking.id}>
                <p className="font-medium">
                  {new Date(booking.starts_at).toLocaleString("en-GB")}–
                  {new Date(booking.ends_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-muted-foreground">
                  {booking.teacher_name}
                  {booking.note ? ` · ${booking.note}` : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No upcoming Tutor Room bookings.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
