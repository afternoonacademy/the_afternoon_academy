import Link from "next/link"
import { notFound } from "next/navigation"

import { updateLearnerPersonalProfile } from "@/actions/learners"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireCapability } from "@/lib/auth/require-capability"
import { supabaseAdmin } from "@/lib/supabase/admin"

type PageProps = { params: Promise<{ id: string }> }

export default async function EditLearnerPage({ params }: PageProps) {
  await requireCapability("edit_learning_record")
  const { id } = await params
  const { data: learner } = await supabaseAdmin
    .from("learners")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!learner) notFound()

  return (
    <div className="space-y-6 pb-10">
      <header className="brand-hero p-6">
        <p className="brand-kicker">Learner record</p>
        <h2 className="mt-2 text-3xl font-bold">Edit {learner.first_name}</h2>
        <p className="mt-2 text-muted-foreground">
          Keep stable profile and school-contact information here, away from the day-to-day teaching workspace.
        </p>
        <Link className="mt-4 inline-block text-sm font-semibold text-primary hover:underline" href={"/admin/learners/" + id}>
          Back to learner workspace
        </Link>
      </header>

      <section className="brand-card max-w-4xl p-6">
        <SaveActionForm
          action={updateLearnerPersonalProfile}
          successMessage="Learner profile saved"
          submitLabel="Save learner profile"
        >
          <input name="learnerId" type="hidden" value={id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input defaultValue={learner.first_name} id="firstName" maxLength={80} name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearGroup">Year group</Label>
              <Input defaultValue={learner.year_group || ""} id="yearGroup" maxLength={80} name="yearGroup" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="currentSchoolName">Current school</Label>
              <Input defaultValue={learner.current_school_name || ""} id="currentSchoolName" maxLength={160} name="currentSchoolName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherName">School teacher/contact name</Label>
              <Input defaultValue={learner.teacher_name || ""} id="teacherName" maxLength={160} name="teacherName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherEmail">School teacher/contact email</Label>
              <Input defaultValue={learner.teacher_email || ""} id="teacherEmail" maxLength={254} name="teacherEmail" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherPhone">School teacher/contact phone</Label>
              <Input defaultValue={learner.teacher_phone || ""} id="teacherPhone" maxLength={50} name="teacherPhone" />
            </div>
          </div>
          <label className="flex gap-3 rounded-md border p-3 text-sm">
            <input
              defaultChecked={learner.school_contact_permission_confirmed}
              name="schoolContactPermissionConfirmed"
              type="checkbox"
            />
            <span>
              I have confirmed it is appropriate to retain these school contact details for TAA&apos;s educational service.
            </span>
          </label>
          <p className="text-xs text-muted-foreground">
            Only record a school contact where it is necessary for the child&apos;s support. Do not add sensitive information to contact fields.
          </p>
        </SaveActionForm>
      </section>
    </div>
  )
}
