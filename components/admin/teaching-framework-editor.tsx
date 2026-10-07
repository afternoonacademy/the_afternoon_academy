import { archiveTeachingFramework, publishTeachingFrameworkVersion, saveTeachingFrameworkDraft } from "@/actions/teaching-frameworks"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TeachingPromptEditor } from "@/components/admin/teaching-prompt-editor"

type Props = {
  framework: { id: string; status: string }
  version: {
    id: string
    version_number: number
    preparation_guidance: string | null
    during_session_guidance: string | null
    goal_guidance: string | null
    evidence_guidance: string | null
    avoid_guidance: string | null
    reference_resources: unknown
    prompt_config: unknown
    published_at: string | null
  } | null
}

export function TeachingFrameworkEditor({ framework, version }: Props) {
  const editable = !version?.published_at
  return (
    <div className="space-y-5">
      {editable ? (
        <form action={saveTeachingFrameworkDraft} className="space-y-5">
          <input name="frameworkId" type="hidden" value={framework.id} />
          {version ? <input name="versionId" type="hidden" value={version.id} /> : null}
          <label className="grid gap-1.5 text-sm font-medium">
            Before the session
            <Textarea className="min-h-28" defaultValue={version?.preparation_guidance || ""} name="preparationGuidance" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            During the session
            <Textarea className="min-h-28" defaultValue={version?.during_session_guidance || ""} name="duringSessionGuidance" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Goal guidance
            <Textarea className="min-h-24" defaultValue={version?.goal_guidance || ""} name="goalGuidance" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Evidence guidance
            <Textarea className="min-h-24" defaultValue={version?.evidence_guidance || ""} name="evidenceGuidance" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Avoid / quality guardrails
            <Textarea className="min-h-24" defaultValue={version?.avoid_guidance || ""} name="avoidGuidance" />
          </label>
          <TeachingPromptEditor initialConfig={Array.isArray(version?.prompt_config) ? version?.prompt_config as never[] : null} />
          <input
            name="referenceResources"
            type="hidden"
            value={JSON.stringify(Array.isArray(version?.reference_resources) ? version?.reference_resources : [])}
          />
          <Button>Save framework draft</Button>
        </form>
      ) : (
        <p className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          Published versions are locked so historical session notes keep the guidance that was used at the time. Create a new draft version to make changes.
        </p>
      )}

      {version ? (
        <div className="flex flex-wrap gap-3 border-t pt-5">
          {!version.published_at ? (
            <form action={publishTeachingFrameworkVersion}>
              <input name="frameworkId" type="hidden" value={framework.id} />
              <input name="versionId" type="hidden" value={version.id} />
              <Button>Publish version {version.version_number}</Button>
            </form>
          ) : null}
          {framework.status !== "archived" ? (
            <form action={archiveTeachingFramework}>
              <input name="frameworkId" type="hidden" value={framework.id} />
              <Button variant="outline">Archive framework</Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
