import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function LearnersPage() {
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
        <div className="overflow-x-auto rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Year group</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {learners.map((learner) => (
                <TableRow key={learner.id}>
                  <TableCell className="font-medium">
                    {learner.first_name}
                  </TableCell>
                  <TableCell>{learner.year_group || "—"}</TableCell>
                  <TableCell>{learner.current_school_name || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className="capitalize"
                      variant={
                        learner.status === "active" ? "default" : "secondary"
                      }
                    >
                      {learner.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className="text-sm font-medium text-primary hover:underline"
                      href={`/admin/learners/${learner.id}`}
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
