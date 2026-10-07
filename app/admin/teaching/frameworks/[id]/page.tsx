import { notFound } from "next/navigation"

import { TeachingFrameworkEditor } from "@/components/admin/teaching-framework-editor"
import { Badge } from "@/components/ui/badge"
import { requireCapability } from "@/lib/auth/require-capability"
import { roleHasCapability } from "@/lib/auth/capabilities.mjs"
import { teachingFrameworkStatusLabel } from "@/lib/teaching/frameworks.mjs"
import { supabaseAdmin } from "@/lib/supabase/admin"

type PageProps = { params: Promise<{ id: string }> }

export default async function TeachingFrameworkPage({ params }: PageProps) {
  const { internalUser } = await requireCapability("view_teaching_hub")
  const canManage = roleHasCapability(internalUser.role, "manage_teaching_frameworks")
  const { id } = await params

  const { data: framework } = await supabaseAdmin
    .from("teaching_frameworks")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!framework) notFound()
  if (!canManage && framework.status !== "published") notFound()

  const { data: versions } = await supabaseAdmin
    .from("teaching_framework_versions")
    .select("*")
    .eq("framework_id", id)
    .order("version_number", { ascending: false })

  const currentVersion = framework.current_version_id
    ? (versions || []).find((item) => item.id === framework.current_version_id) || null
    : (versions || [])[0] || null

  const prompts = Array.isArray(currentVersion?.prompt_config) ? currentVersion.prompt_config : []

  return (
    <div className="space-y-6 pb-10">
      <header className="brand-hero p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="brand-kicker">Teaching framework</p>
            <h2 className="mt-2 text-3xl font-bold">{framework.title}</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{framework.short_description || "No description yet."}</p>
          </div>
          <Badge variant={framework.status === "published" ? "default" : "secondary"}>
            {teachingFrameworkStatusLabel(framework.status)}
          </Badge>
        </div>
      </header>

      {currentVersion ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="brand-card p-5">
              <h3 className="font-semibold">Before the session</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{currentVersion.preparation_guidance || "No preparation guidance yet."}</p>
            </section>
            <section className="brand-card p-5">
              <h3 className="font-semibold">During the session</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{currentVersion.during_session_guidance || "No in-session guidance yet."}</p>
            </section>
          </div>

          <section className="brand-card p-5">
            <h3 className="font-semibold">After-session prompts</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {prompts.map((prompt: Record<string, unknown>) => (
                <div className="rounded-xl border p-4" key={String(prompt.key)}>
                  <p className="font-medium">{String(prompt.label || prompt.key)}</p>
                  {prompt.help ? <p className="mt-1 text-sm text-muted-foreground">{String(prompt.help)}</p> : null}
                  {prompt.example ? <p className="mt-2 text-xs text-muted-foreground">Example: {String(prompt.example)}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="rounded-xl border p-5 text-sm text-muted-foreground">This framework does not have any guidance yet.</p>
      )}

      {canManage ? (
        <section className="brand-card p-6">
          <h3 className="text-lg font-semibold">Manage framework</h3>
          <div className="mt-4">
            <TeachingFrameworkEditor framework={framework} version={(versions || [])[0] || null} />
          </div>
        </section>
      ) : null}
    </div>
  )
}
