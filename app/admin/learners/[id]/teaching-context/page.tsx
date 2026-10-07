import Link from "next/link"
import { notFound } from "next/navigation"

import {
  createLearnerFrameworkAssignment,
  endLearnerFrameworkAssignment,
  setDefaultLearnerFramework,
  updateLearnerFrameworkAssignment,
} from "@/actions/learner-teaching-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { requireCapability } from "@/lib/auth/require-capability"
import { supabaseAdmin } from "@/lib/supabase/admin"

type PageProps = { params: Promise<{ id: string }> }

export default async function LearnerTeachingContextPage({ params }: PageProps) {
  await requireCapability("edit_learning_record")
  const { id } = await params
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: learner }, { data: frameworks }, { data: assignments }] =
    await Promise.all([
      supabaseAdmin
        .from("learners")
        .select("id,first_name,year_group,current_school_name")
        .eq("id", id)
        .maybeSingle(),
      supabaseAdmin
        .from("teaching_frameworks")
        .select("id,title,current_version_id")
        .eq("status", "published")
        .order("title"),
      supabaseAdmin
        .from("learner_teaching_frameworks")
        .select("*,teaching_frameworks(title)")
        .eq("learner_id", id)
        .order("starts_on", { ascending: false }),
    ])

  if (!learner) notFound()

  return (
    <div className="space-y-6 pb-10">
      <header className="brand-hero p-6">
        <p className="brand-kicker">Teaching context</p>
        <h2 className="mt-2 text-3xl font-bold">{learner.first_name}</h2>
        <p className="mt-2 text-muted-foreground">
          Assign the types of support this learner receives. Keep old frameworks here so their learning history stays intact.
        </p>
        <Link className="mt-4 inline-block text-sm font-semibold text-primary hover:underline" href={"/admin/learners/" + id}>
          Back to learner workspace
        </Link>
      </header>

      <section className="brand-card p-5">
        <h3 className="font-semibold">Add teaching context</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The framework controls the teaching prompts; the fields below describe this learner's course or current focus.
        </p>
        <form action={createLearnerFrameworkAssignment} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="learnerId" type="hidden" value={id} />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" name="frameworkId" required>
            <option value="">Choose framework</option>
            {(frameworks || []).map((framework) => (
              <option key={framework.id} value={framework.id}>{framework.title}</option>
            ))}
          </select>
          <Input defaultValue={today} name="startsOn" required type="date" />
          <Input name="curriculumCourse" placeholder="Course/curriculum, if relevant" />
          <Input name="examBoard" placeholder="Exam board, if relevant" />
          <Input className="md:col-span-2" name="currentUnitTopic" placeholder="Current unit/topic" />
          <Textarea className="md:col-span-2" name="learnerObjectives" placeholder="Current learner objectives — short and practical" />
          <Textarea className="md:col-span-2" name="teacherContext" placeholder="Anything the next teacher should know about this context" />
          <label className="flex items-center gap-2 text-sm">
            <input name="isDefault" type="checkbox" />
            Use as the default for normal sessions
          </label>
          <Button className="w-fit">Add teaching context</Button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">Learner framework history</h3>
          <p className="text-sm text-muted-foreground">Active, paused and ended support periods all remain visible.</p>
        </div>
        {(assignments || []).length ? assignments?.map((assignment) => {
          const framework = Array.isArray(assignment.teaching_frameworks)
            ? assignment.teaching_frameworks[0]
            : assignment.teaching_frameworks
          return (
            <article className="brand-card p-5" key={assignment.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{framework?.title || "Teaching framework"}</p>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {assignment.status} · from {assignment.starts_on}
                    {assignment.ends_on ? " to " + assignment.ends_on : ""}
                    {assignment.is_default ? " · default" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {assignment.status === "active" && !assignment.is_default ? (
                    <form action={setDefaultLearnerFramework}>
                      <input name="learnerId" type="hidden" value={id} />
                      <input name="assignmentId" type="hidden" value={assignment.id} />
                      <Button size="sm" variant="outline">Make default</Button>
                    </form>
                  ) : null}
                  {assignment.status === "active" ? (
                    <form action={endLearnerFrameworkAssignment}>
                      <input name="learnerId" type="hidden" value={id} />
                      <input name="assignmentId" type="hidden" value={assignment.id} />
                      <Button size="sm" variant="outline">End support period</Button>
                    </form>
                  ) : null}
                </div>
              </div>

              <form action={updateLearnerFrameworkAssignment} className="mt-4 grid gap-3 md:grid-cols-2">
                <input name="assignmentId" type="hidden" value={assignment.id} />
                <input name="learnerId" type="hidden" value={id} />
                <input name="frameworkId" type="hidden" value={assignment.framework_id} />
                <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={assignment.status} name="status">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ended">Ended</option>
                </select>
                <Input defaultValue={assignment.starts_on} name="startsOn" required type="date" />
                <Input defaultValue={assignment.ends_on || ""} name="endsOn" type="date" />
                <Input defaultValue={assignment.curriculum_course || ""} name="curriculumCourse" placeholder="Course/curriculum" />
                <Input defaultValue={assignment.exam_board || ""} name="examBoard" placeholder="Exam board" />
                <Input defaultValue={assignment.current_unit_topic || ""} name="currentUnitTopic" placeholder="Current unit/topic" />
                <Textarea className="md:col-span-2" defaultValue={assignment.learner_objectives || ""} name="learnerObjectives" placeholder="Current learner objectives" />
                <Textarea className="md:col-span-2" defaultValue={assignment.teacher_context || ""} name="teacherContext" placeholder="Teacher context" />
                <label className="flex items-center gap-2 text-sm">
                  <input defaultChecked={assignment.is_default} name="isDefault" type="checkbox" />
                  Default when active
                </label>
                <Button className="w-fit" variant="secondary">Save context</Button>
              </form>
            </article>
          )
        }) : (
          <p className="rounded-xl border p-5 text-sm text-muted-foreground">No teaching frameworks have been assigned yet.</p>
        )}
      </section>
    </div>
  )
}
