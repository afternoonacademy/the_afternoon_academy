import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { teachingFrameworkStatusLabel } from "@/lib/teaching/frameworks.mjs"

type FrameworkCardProps = {
  framework: {
    id: string
    title: string
    short_description: string | null
    stage_guidance: string | null
    provision_type: string | null
    status: string
  }
}

export function TeachingFrameworkCard({ framework }: FrameworkCardProps) {
  return (
    <Link
      className="brand-card block p-5 transition hover:border-primary/40 hover:bg-muted/20"
      href={"/admin/teaching/frameworks/" + framework.id}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{framework.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {framework.short_description || "No description yet."}
          </p>
        </div>
        <Badge variant={framework.status === "published" ? "default" : "secondary"}>
          {teachingFrameworkStatusLabel(framework.status)}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {framework.provision_type ? <span>{framework.provision_type.replaceAll("_", " ")}</span> : null}
        {framework.stage_guidance ? <span>· {framework.stage_guidance}</span> : null}
      </div>
    </Link>
  )
}
