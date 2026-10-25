"use client"

import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TEACHING_NOTE_FIELDS, generalHomeworkSupportPromptConfig } from "@/lib/teaching/frameworks.mjs"

type PromptField = {
  key: string
  label?: string
  help?: string
  example?: string
  required?: boolean
  quickChoice?: string
}

export function TeachingPromptEditor({ initialConfig }: { initialConfig?: PromptField[] | null }) {
  const initial = useMemo(() => {
    const incoming = Array.isArray(initialConfig) ? initialConfig : []
    const byKey = new Map(incoming.map((item) => [item.key, item]))
    return TEACHING_NOTE_FIELDS.map((key: string) => {
      const fallback = generalHomeworkSupportPromptConfig.find((item) => item.key === key)
      return { ...fallback, ...(byKey.get(key) || {}), key }
    })
  }, [initialConfig])
  const [fields, setFields] = useState<PromptField[]>(initial)

  function update(index: number, patch: Partial<PromptField>) {
    setFields((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  return (
    <div className="space-y-4">
      <input name="promptConfig" type="hidden" value={JSON.stringify(fields)} />
      {fields.map((field, index) => (
        <section className="rounded-xl border p-4" key={field.key}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">{index + 1}. {field.label || field.key}</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={Boolean(field.required)}
                onChange={(event) => update(index, { required: event.target.checked })}
                type="checkbox"
              />
              Required
            </label>
          </div>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium">
              Field label
              <Input value={field.label || ""} onChange={(event) => update(index, { label: event.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Teacher tip
              <Textarea value={field.help || ""} onChange={(event) => update(index, { help: event.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Example
              <Textarea value={field.example || ""} onChange={(event) => update(index, { example: event.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Optional quick choice
              <Input value={field.quickChoice || ""} onChange={(event) => update(index, { quickChoice: event.target.value })} />
            </label>
          </div>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">
        These four teaching-note concepts stay fixed so TAA remains quick and consistent. You can change the wording, tips and examples for each framework.
      </p>
    </div>
  )
}
