"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import { renderLearningUpdateEmail } from "@/lib/email/learning-update.mjs"
import { emailFrom, getResend } from "@/lib/resend"
import { supabaseService } from "@/lib/supabase/service"

const sendSchema = z.object({
  learnerId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  subject: z.string().trim().min(2).max(140),
  body: z.string().trim().min(10).max(5000),
})

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

export async function sendFamilyLearningUpdate(formData: FormData) {
  const { internalUser } = await requireAdmin()
  const parsed = sendSchema.safeParse({
    learnerId: formData.get("learnerId"),
    month: formData.get("month"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  })

  if (!parsed.success) {
    throw new Error("Check the family update subject and message before sending")
  }

  const supabase = supabaseService()
  const { data: learner, error: learnerError } = await supabase
    .from("learners")
    .select("id,first_name,parent_lead_id,parent_leads(id,parent_name,email)")
    .eq("id", parsed.data.learnerId)
    .maybeSingle()

  if (learnerError || !learner) {
    throw new Error("Learner could not be found")
  }

  const parent = relationOne(learner.parent_leads)
  if (!parent?.email || !learner.parent_lead_id) {
    throw new Error("This learner's family does not have a valid email address")
  }

  const rendered = renderLearningUpdateEmail({
    subject: parsed.data.subject,
    body: parsed.data.body,
  })
  const idempotencyKey =
    "learning-update-" +
    parsed.data.learnerId +
    "-" +
    parsed.data.month +
    "-" +
    randomUUID()

  const { data: log, error: logError } = await supabase
    .from("email_delivery_log")
    .insert({
      parent_lead_id: learner.parent_lead_id,
      learner_id: learner.id,
      email_kind: "learning_update",
      recipient_email: parent.email,
      idempotency_key: idempotencyKey,
      subject: rendered.subject,
      body_text: rendered.text,
      created_by: internalUser.id,
    })
    .select("id")
    .single()

  if (logError || !log) {
    throw new Error("Could not prepare the family learning update")
  }

  try {
    const result = await getResend().emails.send(
      {
        from: emailFrom,
        to: [parent.email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      },
      { headers: { "Idempotency-Key": idempotencyKey } },
    )

    if (result.error) throw new Error(result.error.message)

    const sentAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("email_delivery_log")
      .update({
        status: "sent",
        resend_email_id: result.data?.id || null,
        sent_at: sentAt,
      })
      .eq("id", log.id)

    if (updateError) {
      throw new Error("The email was sent but its Academy record could not be updated")
    }
  } catch (error) {
    await supabase
      .from("email_delivery_log")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_message:
          error instanceof Error ? error.message.slice(0, 500) : "Send failed",
      })
      .eq("id", log.id)

    throw new Error(
      error instanceof Error &&
        error.message === "The email was sent but its Academy record could not be updated"
        ? error.message
        : "The family learning update could not be sent",
    )
  }

  revalidatePath("/admin/family-updates")
  revalidatePath("/admin/learners/" + learner.id)
}
