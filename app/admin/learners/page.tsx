import Link from "next/link";

import { LearnerRecordsTable } from "@/components/admin/learner-records-table";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase/admin";

import { requireCapability } from "@/lib/auth/require-capability"

export default async function LearnersPage() {
  await requireCapability("view_learners")
  const { data: learners, error } = await supabaseAdmin
    .from("learners")
    .select(
      "id, first_name, year_group, current_school_name, status, created_at",
    )
    .order("first_name");

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Learners</h2>
          <p className="text-muted-foreground">
            The operational record for every child you support.
          </p>
        </div>
        <Link
          href="/admin/learners/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add learner
        </Link>
      </div>
      {error ? (
        <p className="rounded-lg border p-6">
          Could not load learners: {error.message}
        </p>
      ) : null}
      {!error && !learners?.length ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            No learner records yet. Add a learner once a family has confirmed
            they would like to begin.
          </CardContent>
        </Card>
      ) : null}
      {learners?.length ? (
        <LearnerRecordsTable learners={learners} />
      ) : null}
    </div>
  );
}
