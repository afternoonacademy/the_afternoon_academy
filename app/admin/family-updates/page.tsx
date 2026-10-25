import { FamilySummaryWorkspace } from "@/components/admin/family-summary-workspace"
import { requireCapability } from "@/lib/auth/require-capability"
import { supabaseAdmin } from "@/lib/supabase/admin"

export default async function FamilyUpdatesPage() {
  await requireCapability("view_family_updates")

  const today = new Date()
  const month = today.toISOString().slice(0, 7)
  const start = `${month}-01`
  const end = new Date(`${start}T12:00:00Z`)
  end.setUTCMonth(end.getUTCMonth() + 1)
  const endDate = end.toISOString().slice(0, 10)

  const { data: updates } = await supabaseAdmin
    .from("teacher_updates")
    .select("learner_id")
    .gte("occurred_on", start)
    .lt("occurred_on", endDate)

  const counts = new Map<string, number>()
  for (const update of updates || []) {
    counts.set(update.learner_id, (counts.get(update.learner_id) || 0) + 1)
  }

  const learnerIds = [...counts.keys()]
  const { data: learners } = await supabaseAdmin
    .from("learners")
    .select("id,first_name,year_group")
    .in(
      "id",
      learnerIds.length
        ? learnerIds
        : ["00000000-0000-0000-0000-000000000000"],
    )

  return (
    <div className="space-y-8 pb-10">
      <div className="border-b pb-6">
        <p className="text-sm font-semibold text-muted-foreground">
          Management review · separate from teacher input
        </p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">
          Family updates
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Review the learner&apos;s verified monthly learning evidence, create a
          concise AI-assisted parent draft, edit it, then explicitly send it.
          TAA complements the child&apos;s school rather than producing a formal
          school report.
        </p>
      </div>

      <section className="border-t pt-6">
        <h3 className="text-xl font-bold">Monthly summary workspace</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Learners with teaching notes this month appear here. Attendance is not
          included in the family summary at this stage.
        </p>
        <div className="mt-5">
          <FamilySummaryWorkspace
            learners={(learners || []).map((learner) => ({
              ...learner,
              noteCount: counts.get(learner.id) || 0,
            }))}
            month={month}
          />
        </div>
      </section>
    </div>
  )
}
