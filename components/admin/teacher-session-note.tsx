"use client"

import { useMemo, useState } from "react"
import { Info } from "lucide-react"

import { createTeacherUpdate } from "@/actions/learners"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type PromptField = {
  key: string
  label: string
  help?: string
  example?: string
  required?: boolean
  quickChoice?: string
}

type Assignment = {
  id: string
  is_default: boolean
  framework: { title: string }
  version: { id: string; prompt_config: PromptField[] }
}

const fallbackPrompts: PromptField[] = [
  {
    key: "working_on",
    label: "What were we working on?",
    help: "Briefly record the homework, subject and topic.",
    example: "Maths homework — adding and subtracting fractions.",
    required: true,
  },
  {
    key: "support_needed",
    label: "Where did they need support?",
    help: "Record the point where the learner became stuck, uncertain or needed help. Add what helped only if it will be useful next time.",
    example: "Could find a common denominator but became unsure when simplifying the final answer.",
    required: false,
    quickChoice: "No specific issue",
  },
  {
    key: "reached",
    label: "Where did we get to?",
    help: "Record what was completed and what the learner could do by the end of the session.",
    example: "Completed questions 1–8; last three completed independently after one worked example.",
    required: true,
  },
  {
    key: "next_step",
    label: "What should we pick up next?",
    help: "Record the most useful thing for the next TAA session to revisit, practise or check.",
    example: "Quick retrieval on simplifying fractions before moving on.",
    required: true,
    quickChoice: "Nothing specific / Continue as normal",
  },
]

function PromptLabel({ field }: { field: PromptField }) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={field.key}>{field.label}</Label>
      {field.help ? (
        <span
          aria-label={field.help}
          className="inline-flex cursor-help text-muted-foreground"
          title={field.help}
        >
          <Info className="size-4" />
        </span>
      ) : null}
    </div>
  )
}

export function TeacherSessionNote({
  learnerId,
  today,
  assignments,
}: {
  learnerId: string
  today: string
  assignments: Assignment[]
}) {
  const initialId =
    assignments.find((item) => item.is_default)?.id ||
    (assignments.length === 1 ? assignments[0].id : "")
  const [assignmentId, setAssignmentId] = useState(initialId)
  const [supportNeeded, setSupportNeeded] = useState("")
  const [nextStep, setNextStep] = useState("")

  const selected = assignments.find((item) => item.id === assignmentId) || null
  const prompts = useMemo(() => {
    const config = selected?.version?.prompt_config
    return Array.isArray(config) && config.length ? config : fallbackPrompts
  }, [selected])

  const byKey = (key: string) =>
    prompts.find((field) => field.key === key) ||
    fallbackPrompts.find((field) => field.key === key)!

  return (
    <SaveActionForm
      action={createTeacherUpdate}
      successMessage="Session note saved"
      submitLabel="Save session note"
    >
      <input name="learnerId" type="hidden" value={learnerId} />
      <input name="noteFormat" type="hidden" value="contextual" />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="space-y-2">
          <Label htmlFor="assignmentId">Session type</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="assignmentId"
            name="assignmentId"
            onChange={(event) => setAssignmentId(event.target.value)}
            required={assignments.length > 1}
            value={assignmentId}
          >
            {assignments.length > 1 ? (
              <option value="">Choose the framework for this session</option>
            ) : null}
            {assignments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.framework.title}{item.is_default ? " · default" : ""}
              </option>
            ))}
            {!assignments.length ? <option value="">General session note</option> : null}
          </select>
          <p className="text-xs text-muted-foreground">
            This changes today&apos;s prompts only. It does not change the learner&apos;s longer-term teaching context.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="occurredOn">Date</Label>
          <Input defaultValue={today} id="occurredOn" name="occurredOn" required type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <PromptLabel field={byKey("working_on")} />
        <Textarea
          id="working_on"
          maxLength={2000}
          name="workingOn"
          placeholder={byKey("working_on").example || ""}
          required
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <PromptLabel field={byKey("support_needed")} />
        <Textarea
          id="support_needed"
          maxLength={2000}
          name="supportNeeded"
          onChange={(event) => setSupportNeeded(event.target.value)}
          placeholder={byKey("support_needed").example || ""}
          rows={2}
          value={supportNeeded}
        />
        {byKey("support_needed").quickChoice ? (
          <Button
            onClick={() => setSupportNeeded(byKey("support_needed").quickChoice || "")}
            size="sm"
            type="button"
            variant="outline"
          >
            {byKey("support_needed").quickChoice}
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <PromptLabel field={byKey("reached")} />
        <Textarea
          id="reached"
          maxLength={2000}
          name="reached"
          placeholder={byKey("reached").example || ""}
          required
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <PromptLabel field={byKey("next_step")} />
        <Textarea
          id="next_step"
          maxLength={2000}
          name="nextStep"
          onChange={(event) => setNextStep(event.target.value)}
          placeholder={byKey("next_step").example || ""}
          required
          rows={2}
          value={nextStep}
        />
        {byKey("next_step").quickChoice ? (
          <Button
            onClick={() => setNextStep(byKey("next_step").quickChoice || "")}
            size="sm"
            type="button"
            variant="outline"
          >
            {byKey("next_step").quickChoice}
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Keep this short. TAA is capturing the useful handover for the next session, not asking you to write a school report.
      </p>
    </SaveActionForm>
  )
}
