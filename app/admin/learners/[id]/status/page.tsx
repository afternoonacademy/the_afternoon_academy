import Link from "next/link"
import { notFound } from "next/navigation"

import { updateLearnerDetails } from "@/actions/learners"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { requireCapability } from "@/lib/auth/require-capability"
import { supabaseAdmin } from "@/lib/supabase/admin"

type PageProps = { params: Promise<{ id: string }> }

export default async function LearnerStatusPage({ params }: PageProps) {
  await requireCapability("destructive_admin_actions")
  const { id } = await params
  const { data: learner } = await supabaseAdmin
    .from("learners")
    .select("id,first_name,status")
    .eq("id", id)
    .maybeSingle()

  if (!learner) notFound()

  return (
    <div className="space-y-6 pb-10">
      <header className="brand-hero p-6">
        <p className="brand-kicker">Learner lifecycle</p>
        <h2 className="mt-2 text-3xl font-bold">Status · {learner.first_name}</h2>
        <p className="mt-2 text-muted-foreground">
          Status changes preserve attendance, goals and teaching history.
        </p>
        <Link className="mt-4 inline-block text-sm font-semibold text-primary hover:underline" href={"/admin/learners/" + id}>
          Back to learner workspace
        </Link>
      </header>

      <section className="brand-card max-w-xl p-6">
        <form action={updateLearnerDetails} className="space-y-4">
          <input name="learnerId" type="hidden" value={id} />
          <input name="currentSchoolName" type="hidden" value="" />
          <input name="teacherName" type="hidden" value="" />
          <input name="teacherEmail" type="hidden" value="" />
          <input name="teacherPhone" type="hidden" value="" />
          <div className="space-y-2">
            <Label htmlFor="learnerStatus">Learner status</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              defaultValue={learner.status}
              id="learnerStatus"
              name="status"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="left">Left the Academy</option>
            </select>
          </div>
          <Button type="submit">Save status</Button>
        </form>
      </section>
    </div>
  )
}
