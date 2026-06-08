"use server"

import { redirect } from "next/navigation"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { adminLeadEmail, resend, resendFromEmail } from "@/lib/email/resend"
import {
  adminContactNotificationEmailHtml,
  adminContactNotificationEmailText,
  parentContactConfirmationEmailHtml,
  parentContactConfirmationEmailText,
} from "@/lib/email/templates"
import { contactFormSchema } from "@/lib/validations/contact"

export type SubmitContactState = {
  success: boolean
  message: string
}

export async function submitContact(
  _previousState: SubmitContactState,
  formData: FormData
): Promise<SubmitContactState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
    consentContact: formData.get("consentContact") === "on",
  }

  const parsed = contactFormSchema.safeParse(rawData)

  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message || "Please check the form and try again."

    return {
      success: false,
      message: firstError,
    }
  }

  const data = parsed.data

  const { error } = await supabaseAdmin.from("contact_messages").insert({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    message: data.message,
    consent_contact: data.consentContact,
    source: "contact_page",
    status: "new",
  })

  if (error) {
    console.error("Contact message insert error:", error)

    return {
      success: false,
      message: "Something went wrong while sending your message. Please try again.",
    }
  }

  const emailData = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
  }

  if (resend) {
    const parentEmail = await resend.emails.send({
      from: resendFromEmail,
      to: data.email,
      subject: "We received your message",
      html: parentContactConfirmationEmailHtml(emailData),
      text: parentContactConfirmationEmailText(emailData),
    })

    if (parentEmail.error) {
      console.error("Contact confirmation email error:", parentEmail.error)
    }

    if (adminLeadEmail) {
      const adminEmail = await resend.emails.send({
        from: resendFromEmail,
        to: adminLeadEmail,
        replyTo: data.email,
        subject: `New Afternoon Academy message: ${data.name}`,
        html: adminContactNotificationEmailHtml(emailData),
        text: adminContactNotificationEmailText(emailData),
      })

      if (adminEmail.error) {
        console.error("Contact admin email error:", adminEmail.error)
      }
    }
  } else {
    console.warn("Resend is not configured. Skipping contact emails.")
  }

  redirect("/contact/thanks")
}