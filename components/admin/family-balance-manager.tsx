"use client"

import { useMemo, useState } from "react"

import { settleFamilyBalance } from "@/actions/family-account"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Learner = {
  id: string
  firstName: string
}

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

export function FamilyBalanceManager({
  parentLeadId,
  familyBalanceCents,
  learners,
  preparedRenewalAmounts,
}: {
  parentLeadId: string
  familyBalanceCents: number
  learners: Learner[]
  preparedRenewalAmounts: Record<string, number | null>
}) {
  const [open, setOpen] = useState(false)
  const [actionType, setActionType] = useState("")
  const [learnerId, setLearnerId] = useState("")
  const [amountEuros, setAmountEuros] = useState("")

  const amountCents = Math.round(Number(amountEuros || "0") * 100)
  const selectedLearner = learners.find((learner) => learner.id === learnerId)
  const selectedRenewal = learnerId ? preparedRenewalAmounts[learnerId] : null

  const summary = useMemo(() => {
    if (!actionType || !learnerId || !amountEuros || amountCents <= 0) return null
    if (
      (actionType === "apply_to_renewal" || actionType === "add_to_renewal") &&
      typeof selectedRenewal !== "number"
    ) {
      return "Prepare this child's renewal first before applying the family balance."
    }
    if (actionType === "apply_to_renewal" && typeof selectedRenewal === "number") {
      return `Apply ${money(amountCents)} family credit to ${selectedLearner?.firstName || "this child"}'s prepared renewal, reducing it from ${money(selectedRenewal)} to ${money(Math.max(0, selectedRenewal - amountCents))}.`
    }
    if (actionType === "add_to_renewal" && typeof selectedRenewal === "number") {
      return `Add ${money(amountCents)} outstanding family balance to ${selectedLearner?.firstName || "this child"}'s prepared renewal, increasing it from ${money(selectedRenewal)} to ${money(selectedRenewal + amountCents)}.`
    }
    if (actionType === "record_refund") return `Record ${money(amountCents)} family credit as refunded.`
    if (actionType === "record_collected") return `Record ${money(amountCents)} family balance as collected now.`
    if (actionType === "waive_debt") return `Waive ${money(amountCents)} of the outstanding family balance.`
    return null
  }, [actionType, amountCents, amountEuros, selectedLearner, selectedRenewal, learnerId])

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} type="button" variant="outline">
        Manage family balance
      </Button>
    )
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Manage family balance</p>
          <p className="text-sm text-muted-foreground">
            Nothing is preselected. Choose the action deliberately before saving.
          </p>
        </div>
        <Button
          onClick={() => {
            setOpen(false)
            setActionType("")
            setLearnerId("")
            setAmountEuros("")
          }}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </div>

      <SaveActionForm
        action={settleFamilyBalance}
        submitLabel="Confirm family account action"
        successMessage="Family account updated"
      >
        <input name="parentLeadId" type="hidden" value={parentLeadId} />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="familyActionType">Action</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              id="familyActionType"
              name="actionType"
              onChange={(event) => setActionType(event.target.value)}
              required
              value={actionType}
            >
              <option value="">Choose an action…</option>
              {familyBalanceCents < 0 ? (
                <>
                  <option value="apply_to_renewal">Apply credit to prepared bill</option>
                  <option value="record_refund">Record credit refunded</option>
                </>
              ) : (
                <>
                  <option value="add_to_renewal">Add balance to prepared bill</option>
                  <option value="record_collected">Record balance collected now</option>
                  <option value="waive_debt">Waive outstanding balance</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyLearnerId">Child</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              id="familyLearnerId"
              name="learnerId"
              onChange={(event) => setLearnerId(event.target.value)}
              required
              value={learnerId}
            >
              <option value="">Choose a child…</option>
              {learners.map((learner) => (
                <option key={learner.id} value={learner.id}>
                  {learner.firstName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyAmountEuros">Amount</Label>
            <Input
              id="familyAmountEuros"
              max={(Math.abs(familyBalanceCents) / 100).toFixed(2)}
              min="0.01"
              name="amountEuros"
              onChange={(event) => setAmountEuros(event.target.value)}
              placeholder="0.00"
              required
              step="0.01"
              type="number"
              value={amountEuros}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="familyActionReason">Reason / note</Label>
          <Input
            id="familyActionReason"
            maxLength={300}
            name="reason"
            placeholder="Optional note"
          />
        </div>

        {summary ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-semibold">Final check</p>
            <p className="mt-1">{summary}</p>
          </div>
        ) : null}
      </SaveActionForm>
    </div>
  )
}
