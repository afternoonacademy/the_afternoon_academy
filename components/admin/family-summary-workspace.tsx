"use client"

import { useState } from "react"

import { sendFamilyLearningUpdate } from "@/actions/family-updates"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Learner = {
  id: string
  first_name: string
  year_group: string | null
  noteCount: number
}

type EvidenceSection = {
  title: string
  lines: string[]
}

type EvidenceResponse = {
  learnerName: string
  parentName: string
  recipient: string
  noteCount: number
  sections: EvidenceSection[]
}

type DraftResponse = EvidenceResponse & {
  subject: string
  email: string
  internalPlan: string
}

export function FamilySummaryWorkspace({
  learners,
  month,
}: {
  learners: Learner[]
  month: string
}) {
  const [learnerId, setLearnerId] = useState("")
  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null)
  const [draft, setDraft] = useState<DraftResponse | null>(null)
  const [subject, setSubject] = useState("")
  const [email, setEmail] = useState("")
  const [internalPlan, setInternalPlan] = useState("")
  const [reviewing, setReviewing] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState("")

  async function requestSummary(mode: "preview" | "draft") {
    const response = await fetch("/api/admin/family-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId, month, mode }),
    })
    const data = await response.json()
    if (!response.ok) {
      if (Array.isArray(data.sections)) {
        setEvidence({
          learnerName: data.learnerName || "",
          parentName: data.parentName || "Parent",
          recipient: data.recipient || "",
          noteCount: data.noteCount || 0,
          sections: data.sections,
        })
      }
      throw new Error(data.error || "Could not prepare the family update")
    }
    return data
  }

  async function reviewEvidence() {
    setReviewing(true)
    setError("")
    setDraft(null)
    try {
      const data = (await requestSummary("preview")) as EvidenceResponse
      setEvidence(data)
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Could not review monthly evidence",
      )
    } finally {
      setReviewing(false)
    }
  }

  async function generateDraft() {
    setDrafting(true)
    setError("")
    try {
      const data = (await requestSummary("draft")) as DraftResponse
      setEvidence(data)
      setDraft(data)
      setSubject(data.subject)
      setEmail(data.email)
      setInternalPlan(data.internalPlan)
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Could not create the family update",
      )
    } finally {
      setDrafting(false)
    }
  }

  function chooseLearner(value: string) {
    setLearnerId(value)
    setEvidence(null)
    setDraft(null)
    setSubject("")
    setEmail("")
    setInternalPlan("")
    setError("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select
          className="h-10 min-w-64 rounded-md border bg-background px-3 text-sm"
          onChange={(event) => chooseLearner(event.target.value)}
          value={learnerId}
        >
          <option value="">Select learner</option>
          {learners.map((learner) => (
            <option key={learner.id} value={learner.id}>
              {learner.first_name} · {learner.noteCount} note
              {learner.noteCount === 1 ? "" : "s"}
            </option>
          ))}
        </select>
        <Input className="w-40" readOnly type="month" value={month} />
        <Button
          disabled={!learnerId || reviewing}
          onClick={reviewEvidence}
          type="button"
          variant="outline"
        >
          {reviewing ? "Loading evidence…" : "Review monthly evidence"}
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {evidence ? (
        <section className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold">
                Evidence for {evidence.learnerName} · {month}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This is the learning evidence that will be supplied to the monthly
                AI draft. Attendance and commercial information are not included.
              </p>
            </div>
            <Button
              disabled={drafting}
              onClick={generateDraft}
              type="button"
            >
              {drafting ? "Drafting…" : "Draft family update"}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {evidence.sections.map((section) => (
              <div className="rounded-lg border p-4" key={section.title}>
                <p className="font-medium">{section.title}</p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {section.lines.map((line, index) => (
                    <li key={section.title + index}>• {line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Evidence review works independently of AI. Draft generation requires
            Vercel AI Gateway to be enabled for this project.
          </p>
        </section>
      ) : null}

      {draft ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border bg-card p-5">
            <p className="font-semibold">Family email draft</p>
            <p className="mt-1 text-sm text-muted-foreground">
              To: {draft.recipient || "Parent email missing"}
            </p>
            <div className="mt-4">
              <SaveActionForm
                action={sendFamilyLearningUpdate}
                submitLabel="Send parent email"
                successMessage="Family learning update sent"
              >
                <input name="learnerId" type="hidden" value={learnerId} />
                <input name="month" type="hidden" value={month} />
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="family-update-subject">
                    Subject
                  </label>
                  <Input
                    id="family-update-subject"
                    maxLength={140}
                    name="subject"
                    onChange={(event) => setSubject(event.target.value)}
                    required
                    value={subject}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="family-update-body">
                    Parent message
                  </label>
                  <Textarea
                    className="min-h-72"
                    id="family-update-body"
                    maxLength={5000}
                    name="body"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    value={email}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Review and edit every word before sending. The sent email will
                  appear in the learner&apos;s Communications history.
                </p>
              </SaveActionForm>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <p className="font-semibold">Internal next-month teaching plan</p>
            <Textarea
              className="mt-4 min-h-72"
              onChange={(event) => setInternalPlan(event.target.value)}
              value={internalPlan}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              This stays internal. It is not included in the parent email.
            </p>
          </section>
        </div>
      ) : null}
    </div>
  )
}
