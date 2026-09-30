"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import { getResend, emailFrom } from "@/lib/resend"
import { supabaseService } from "@/lib/supabase/service"

const caseSchema = z.object({ caseId: z.string().uuid(), parentLeadId: z.string().uuid() })
const renewalIdentitySchema = z.object({ parentLeadId: z.string().uuid(), sourcePaymentEntitlementId: z.string().uuid(), dueOn: z.string().date() })

function renewalEmail(input: { parentName: string; learnerNames: string; periodEnd: string }) {
  const ends = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(`${input.periodEnd}T12:00:00Z`))
  return {
    subject: `Renewal for ${input.learnerNames} at The Afternoon Academy`,
    text: `Hello ${input.parentName}, ${input.learnerNames}'s current learning period ends on ${ends}. If you would like to continue, please make your usual bank transfer. We will confirm the next period once the funds have cleared. Warmly, The Afternoon Academy`,
    html: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#20304a"><p>Hello ${input.parentName},</p><h1 style="color:#5170ff">Renewal reminder</h1><p>${input.learnerNames}'s current learning period ends on <strong>${ends}</strong>.</p><p>If you would like to continue, please make your usual bank transfer. We will confirm the next period once the funds have cleared.</p><p>Warmly,<br/>The Afternoon Academy</p></main>`,
  }
}

export async function sendRenewalEmail(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = renewalIdentitySchema.safeParse({ parentLeadId: formData.get("parentLeadId"), sourcePaymentEntitlementId: formData.get("sourcePaymentEntitlementId"), dueOn: formData.get("dueOn") })
  if (!parsed.success) throw new Error("This renewal is no longer available")
  const supabase = supabaseService()
  const [{ data: renewal, error: renewalError }, { data: parent }, { data: learners }] = await Promise.all([
    supabase.from("renewal_cases").upsert({ parent_lead_id: parsed.data.parentLeadId, source_payment_entitlement_id: parsed.data.sourcePaymentEntitlementId, due_on: parsed.data.dueOn, updated_by: user.id }, { onConflict: "parent_lead_id,source_payment_entitlement_id" }).select("id,due_on,status").single(),
    supabase.from("parent_leads").select("parent_name,email").eq("id", parsed.data.parentLeadId).single(),
    supabase.from("learners").select("first_name").eq("parent_lead_id", parsed.data.parentLeadId).eq("status", "active"),
  ])
  if (renewalError || !renewal || !parent) throw new Error("Could not load this family renewal")
  const names = (learners || []).map((learner) => learner.first_name).filter(Boolean).join(", ") || "your child"
  const key = `renewal-${renewal.id}`
  const { data: existing } = await supabase.from("email_delivery_log").select("id,status").eq("idempotency_key", key).maybeSingle()
  if (existing?.status === "sent") return
  const { data: log, error: logError } = existing ? { data: existing, error: null } : await supabase.from("email_delivery_log").insert({ parent_lead_id: parsed.data.parentLeadId, email_kind: "renewal_reminder", recipient_email: parent.email, idempotency_key: key, created_by: user.id }).select("id").single()
  if (logError || !log) throw new Error("Could not prepare the renewal email")
  try {
    const result = await getResend().emails.send({ from: emailFrom, to: [parent.email], ...renewalEmail({ parentName: parent.parent_name, learnerNames: names, periodEnd: renewal.due_on }) }, { headers: { "Idempotency-Key": key } })
    if (result.error) throw new Error(result.error.message)
    await Promise.all([
      supabase.from("email_delivery_log").update({ status: "sent", resend_email_id: result.data?.id || null, sent_at: new Date().toISOString() }).eq("id", log.id),
      supabase.from("renewal_cases").update({ status: "awaiting_payment", email_sent_at: new Date().toISOString(), last_contact_at: new Date().toISOString(), updated_by: user.id }).eq("id", renewal.id),
    ])
  } catch (error) {
    await supabase.from("email_delivery_log").update({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "Send failed" }).eq("id", log.id)
    throw new Error("The renewal email could not be sent")
  }
  revalidatePath("/admin/renewals")
}

export async function closeRenewal(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = caseSchema.extend({ note: z.string().trim().max(500).optional() }).safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId"), note: formData.get("note") || undefined })
  if (!parsed.success) throw new Error("Please check the renewal outcome")
  const { error } = await supabaseService().from("renewal_cases").update({ status: "not_renewing", outcome_note: parsed.data.note || null, closed_at: new Date().toISOString(), updated_by: user.id }).eq("id", parsed.data.caseId).eq("parent_lead_id", parsed.data.parentLeadId)
  if (error) throw new Error("Could not close this renewal")
  revalidatePath("/admin/renewals")
}
