"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import { supabaseService } from "@/lib/supabase/service"

const schema = z.object({
  parentLeadId: z.string().uuid(),
  learnerId: z.string().uuid().optional(),
  actionType: z.enum([
    "apply_to_renewal",
    "add_to_renewal",
    "record_refund",
    "record_collected",
    "waive_debt",
  ]),
  amountEuros: z.coerce.number().positive().max(100000),
  reason: z.string().trim().max(300).optional(),
})

type Adjustment = {
  id?: string
  amountCents?: number
  entryType?: string
  originatingLearnerId?: string
  originatingLearnerName?: string
  appliedToLearnerId?: string
  appliedToLearnerName?: string
  reason?: string | null
  createdBy?: string
  createdAt?: string
  [key: string]: unknown
}

function adjustments(value: unknown): Adjustment[] {
  return Array.isArray(value) ? (value as Adjustment[]) : []
}

function balanceCents(entries: Adjustment[]) {
  return entries.reduce(
    (total, entry) =>
      total + (typeof entry.amountCents === "number" ? entry.amountCents : 0),
    0,
  )
}

export async function settleFamilyBalance(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = schema.safeParse({
    parentLeadId: formData.get("parentLeadId"),
    learnerId: formData.get("learnerId") || undefined,
    actionType: formData.get("actionType"),
    amountEuros: formData.get("amountEuros"),
    reason: formData.get("reason") || undefined,
  })
  if (!parsed.success) throw new Error("Check the family account action")

  const data = parsed.data
  const amountCents = Math.round(data.amountEuros * 100)
  const supabase = supabaseService()

  const { data: parent, error: parentError } = await supabase
    .from("parent_leads")
    .select("id,account_adjustments")
    .eq("id", data.parentLeadId)
    .single()
  if (parentError || !parent) throw new Error("Family account could not be loaded")

  const entries = adjustments(parent.account_adjustments)
  const currentBalance = balanceCents(entries)
  if (currentBalance === 0) throw new Error("This family account is already settled")
  if (amountCents > Math.abs(currentBalance)) {
    throw new Error("Amount exceeds the available family balance")
  }

  const needsCredit = data.actionType === "apply_to_renewal" || data.actionType === "record_refund"
  const needsDebt =
    data.actionType === "add_to_renewal" ||
    data.actionType === "record_collected" ||
    data.actionType === "waive_debt"

  if (needsCredit && currentBalance >= 0) throw new Error("This family does not have credit available")
  if (needsDebt && currentBalance <= 0) throw new Error("This family does not have an outstanding balance")

  let targetLearner: { id: string; first_name: string; parent_lead_id: string } | null = null
  if (data.learnerId) {
    const { data: learner, error } = await supabase
      .from("learners")
      .select("id,first_name,parent_lead_id")
      .eq("id", data.learnerId)
      .single()
    if (error || !learner || learner.parent_lead_id !== data.parentLeadId) {
      throw new Error("Choose a learner from this family")
    }
    targetLearner = learner
  }

  let renewalCaseId: string | null = null
  if (data.actionType === "apply_to_renewal" || data.actionType === "add_to_renewal") {
    if (!targetLearner) throw new Error("Choose the child whose next bill should use this balance")

    const { data: renewal, error } = await supabase
      .from("renewal_cases")
      .select("id,status,email_sent_at,proposed_amount_cents")
      .eq("parent_lead_id", data.parentLeadId)
      .eq("learner_id", targetLearner.id)
      .eq("status", "ready_to_send")
      .is("email_sent_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !renewal) {
      throw new Error("Prepare this child's next renewal before applying the family balance")
    }

    const currentAmount = renewal.proposed_amount_cents || 0
    const nextAmount =
      data.actionType === "apply_to_renewal"
        ? currentAmount - amountCents
        : currentAmount + amountCents

    if (nextAmount < 0) {
      throw new Error("Credit cannot exceed this child's prepared renewal amount")
    }

    const { error: renewalError } = await supabase
      .from("renewal_cases")
      .update({ proposed_amount_cents: nextAmount })
      .eq("id", renewal.id)
    if (renewalError) throw new Error("The prepared renewal could not be adjusted")
    renewalCaseId = renewal.id
  }

  const offset = currentBalance < 0 ? amountCents : -amountCents
  const entry: Adjustment = {
    id: randomUUID(),
    entryType: data.actionType,
    amountCents: offset,
    appliedToLearnerId: targetLearner?.id,
    appliedToLearnerName: targetLearner?.first_name,
    renewalCaseId,
    reason: data.reason || null,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from("parent_leads")
    .update({ account_adjustments: [...entries, entry] })
    .eq("id", data.parentLeadId)
  if (updateError) throw new Error("The family account could not be updated")

  revalidatePath("/admin/families/" + data.parentLeadId)
  revalidatePath("/admin/leads")
  revalidatePath("/admin/renewals")
}
