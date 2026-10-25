"use client"

import { useActionState, useState } from "react"
import { LoaderCircle } from "lucide-react"

import {
  createManualLead,
  type ManualLeadActionState,
} from "@/actions/update-lead-status"
import {
  LeadChildFields,
  type LeadChildDraft,
} from "@/components/forms/lead-child-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: ManualLeadActionState = {}

function emptyChild(key: number): LeadChildDraft {
  return {
    key,
    firstName: "",
    age: "",
    schoolName: "",
    schoolYear: "",
    curriculum: "",
    supportNeeds: [],
    courseOrExamBoard: "",
    preferredDays: [],
    preferredTimes: [],
    preferredFrequency: "",
    notes: "",
  }
}

export function ManualFamilyLeadForm() {
  const [state, action, pending] = useActionState(createManualLead, initialState)
  const [children, setChildren] = useState<LeadChildDraft[]>([emptyChild(1)])
  const [nextKey, setNextKey] = useState(2)

  const serialisedChildren = children.map(({ key: _key, ...child }) => child)

  return (
    <form action={action} className="space-y-8">
      <input
        name="children"
        type="hidden"
        value={JSON.stringify(serialisedChildren)}
      />

      {state.error ? (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">Parent / family details</h3>
          <p className="text-sm text-muted-foreground">
            Record the family contact once, then add each child separately.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="parentName">Parent name</Label>
            <Input id="parentName" name="parentName" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              defaultValue="phone"
              id="source"
              name="source"
            >
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="referral">Referral</option>
              <option value="walk_in">Walk-in</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">Children</h3>
          <p className="text-sm text-muted-foreground">
            Each child becomes a separate child lead with their own support
            needs and timetable preferences.
          </p>
        </div>

        <div className="space-y-5">
          {children.map((child, index) => (
            <LeadChildFields
              canRemove={children.length > 1}
              child={child}
              index={index}
              key={child.key}
              language="en"
              onChange={(next) =>
                setChildren((current) =>
                  current.map((item) =>
                    item.key === child.key ? next : item,
                  ),
                )
              }
              onRemove={() =>
                setChildren((current) =>
                  current.filter((item) => item.key !== child.key),
                )
              }
            />
          ))}
        </div>

        <Button
          className="w-full sm:w-auto"
          disabled={pending}
          onClick={() => {
            setChildren((current) => [...current, emptyChild(nextKey)])
            setNextKey((value) => value + 1)
          }}
          type="button"
          variant="outline"
        >
          + Add another child
        </Button>
      </section>

      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" />
            Saving family lead…
          </>
        ) : (
          "Add to family pipeline"
        )}
      </Button>
    </form>
  )
}
