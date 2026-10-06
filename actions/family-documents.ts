"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import {
  REGISTRATION_AUTHORISATION_DOCUMENT_KEY,
  REGISTRATION_AUTHORISATION_FORM_URL,
  registrationAuthorisationTemplateContract,
  renderRegistrationAuthorisationEmail,
} from "@/lib/admin/family-documents.mjs"
import { emailFrom, getResend } from "@/lib/resend"
import { supabaseService } from "@/lib/supabase/service"

const familySchema = z.object({ parentLeadId: z.string().uuid() })
const signedSchema = familySchema.extend({ signedOn: z.string().date() })

function htmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function emailHtml(body: string) {
  const escaped = htmlEscape(body).replaceAll("\n", "<br/>")
  const escapedUrl = htmlEscape(REGISTRATION_AUTHORISATION_FORM_URL)
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">${escaped.replaceAll(
    escapedUrl,
    `<a href="${escapedUrl}">Open and complete the Parent Registration &amp; Authorisation Form</a>`,
  )}</div>`
}

export async function sendRegistrationAuthorisationForm(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = familySchema.safeParse({
    parentLeadId: formData.get("parentLeadId"),
  })
  if (!parsed.success) throw new Error("This family could not be identified")

  const supabase = supabaseService()
  const [{ data: parent }, { data: template }, { data: existingDocument }] =
    await Promise.all([
      supabase
        .from("parent_leads")
        .select("id,parent_name,email")
        .eq("id", parsed.data.parentLeadId)
        .single(),
      supabase
        .from("academy_email_templates")
        .select("subject_template,body_template")
        .eq("template_key", "registration_authorisation")
        .maybeSingle(),
      supabase
        .from("family_documents")
        .select("id,status,send_count")
        .eq("parent_lead_id", parsed.data.parentLeadId)
        .eq("document_key", REGISTRATION_AUTHORISATION_DOCUMENT_KEY)
        .maybeSingle(),
    ])

  if (!parent?.email) throw new Error("This family does not have a valid email address")
  if (existingDocument?.status === "signed") {
    throw new Error("This registration form is already recorded as signed")
  }

  const rendered = renderRegistrationAuthorisationEmail({
    parentName: parent.parent_name,
    subjectTemplate:
      template?.subject_template ||
      registrationAuthorisationTemplateContract.defaultSubject,
    bodyTemplate:
      template?.body_template ||
      registrationAuthorisationTemplateContract.defaultBody,
  })
  const idempotencyKey =
    "registration-authorisation-" + parent.id + "-" + randomUUID()

  const { data: log, error: logError } = await supabase
    .from("email_delivery_log")
    .insert({
      parent_lead_id: parent.id,
      email_kind: "registration_authorisation",
      recipient_email: parent.email,
      idempotency_key: idempotencyKey,
      subject: rendered.subject,
      body_text: rendered.body,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (logError || !log) throw new Error("Could not prepare the registration email")

  try {
    const result = await getResend().emails.send(
      {
        from: emailFrom,
        to: [parent.email],
        subject: rendered.subject,
        html: emailHtml(rendered.body),
        text: rendered.body,
      },
      { headers: { "Idempotency-Key": idempotencyKey } },
    )
    if (result.error) throw new Error(result.error.message)

    const sentAt = new Date().toISOString()
    const documentWrite = existingDocument
      ? supabase
          .from("family_documents")
          .update({
            status: "sent",
            form_url: REGISTRATION_AUTHORISATION_FORM_URL,
            sent_at: sentAt,
            send_count: (existingDocument.send_count || 0) + 1,
            last_email_delivery_log_id: log.id,
            updated_by: user.id,
            updated_at: sentAt,
          })
          .eq("id", existingDocument.id)
      : supabase.from("family_documents").insert({
          parent_lead_id: parent.id,
          document_key: REGISTRATION_AUTHORISATION_DOCUMENT_KEY,
          provider: "adobe_web_form",
          status: "sent",
          form_url: REGISTRATION_AUTHORISATION_FORM_URL,
          sent_at: sentAt,
          send_count: 1,
          last_email_delivery_log_id: log.id,
          created_by: user.id,
          updated_by: user.id,
        })

    const [logUpdate, documentUpdate] = await Promise.all([
      supabase
        .from("email_delivery_log")
        .update({
          status: "sent",
          resend_email_id: result.data?.id || null,
          sent_at: sentAt,
        })
        .eq("id", log.id),
      documentWrite,
    ])

    if (logUpdate.error || documentUpdate.error) {
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
        : "The registration form email could not be sent",
    )
  }

  revalidatePath("/admin/families/" + parent.id)
  revalidatePath("/admin/leads")
}

export async function markRegistrationAuthorisationSigned(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = signedSchema.safeParse({
    parentLeadId: formData.get("parentLeadId"),
    signedOn: formData.get("signedOn"),
  })
  if (!parsed.success) throw new Error("Choose the date the parent signed the form")

  const today = new Date().toISOString().slice(0, 10)
  if (parsed.data.signedOn > today) {
    throw new Error("The signed date cannot be in the future")
  }

  const supabase = supabaseService()
  const { data: parent } = await supabase
    .from("parent_leads")
    .select("id")
    .eq("id", parsed.data.parentLeadId)
    .maybeSingle()
  if (!parent) throw new Error("This family could not be found")

  const { data: existing } = await supabase
    .from("family_documents")
    .select("id,status,send_count")
    .eq("parent_lead_id", parent.id)
    .eq("document_key", REGISTRATION_AUTHORISATION_DOCUMENT_KEY)
    .maybeSingle()

  if (existing?.status === "signed") {
    throw new Error("This registration form is already recorded as signed")
  }

  const signedAt = parsed.data.signedOn + "T12:00:00Z"
  const result = existing
    ? await supabase
        .from("family_documents")
        .update({
          status: "signed",
          signed_at: signedAt,
          signed_recorded_by: user.id,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
    : await supabase.from("family_documents").insert({
        parent_lead_id: parent.id,
        document_key: REGISTRATION_AUTHORISATION_DOCUMENT_KEY,
        provider: "adobe_web_form",
        status: "signed",
        form_url: REGISTRATION_AUTHORISATION_FORM_URL,
        signed_at: signedAt,
        send_count: 0,
        signed_recorded_by: user.id,
        created_by: user.id,
        updated_by: user.id,
      })

  if (result.error) throw new Error("Could not record the signed registration form")

  revalidatePath("/admin/families/" + parent.id)
  revalidatePath("/admin/leads")
}
