import Link from "next/link"

import { createTeachingFramework } from "@/actions/teaching-frameworks"
import { TeachingFrameworkCard } from "@/components/admin/teaching-framework-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requireCapability } from "@/lib/auth/require-capability"
import { roleHasCapability } from "@/lib/auth/capabilities.mjs"
import { frameworksVisibleToRole } from "@/lib/teaching/framework-presentation.mjs"
import { supabaseAdmin } from "@/lib/supabase/admin"

export default async function TeachingHubPage() {
  const { internalUser } = await requireCapability("view_teaching_hub")
  const canManage = roleHasCapability(internalUser.role, "manage_teaching_frameworks")
  const { data } = await supabaseAdmin
    .from("teaching_frameworks")
    .select("id,title,short_description,stage_guidance,provision_type,status")
    .order("title")

  const frameworks = frameworksVisibleToRole(data || [], internalUser.role)

  return (
    <div className="space-y-6 pb-10">
      <div className="brand-hero p-6">
        <p className="brand-kicker">Teaching hub</p>
        <h2 className="mt-2 text-3xl font-bold">Practical guidance, not paperwork</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Use Academy frameworks to prepare quickly, teach consistently and leave a short useful handover for the next session.
        </p>
      </div>

      {canManage ? (
        <section className="brand-card p-5">
          <h3 className="font-semibold">Create teaching framework</h3>
          <form action={createTeachingFramework} className="mt-3 grid gap-3 md:grid-cols-2">
            <Input name="title" placeholder="Framework title" required />
            <Input name="slug" placeholder="framework-slug" required />
            <Input name="provisionType" placeholder="Provision type, e.g. homework_support" />
            <Input name="stageGuidance" placeholder="Age/stage guidance" />
            <Input className="md:col-span-2" name="shortDescription" placeholder="Short description" />
            <Button className="w-fit">Create framework</Button>
          </form>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">Teaching frameworks</h3>
            <p className="text-sm text-muted-foreground">Choose a framework to see its crib sheet and session-note guidance.</p>
          </div>
          <Link className="text-sm font-semibold text-primary hover:underline" href="/admin/learners">Open learners</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {frameworks.length ? frameworks.map((framework) => <TeachingFrameworkCard framework={framework} key={framework.id} />) : (
            <p className="text-sm text-muted-foreground">No published teaching frameworks are available yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
