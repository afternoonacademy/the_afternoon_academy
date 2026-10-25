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

function getGenericErrorMessage(language: "en" | "es") {
  return language === "es"
    ? "Ha ocurrido un error al enviar tu mensaje. Inténtalo de nuevo."
    : "Something went wrong while sending your message. Please try again."
}

function looksRandomSingleToken(value: string) {
  const trimmed = value.trim()

  if (trimmed.length < 14) return false
  if (/\s/.test(trimmed)) return false
  if (!/^[A-Za-z]+$/.test(trimmed)) return false

  const hasUppercase = /[A-Z]/.test(trimmed)
  const hasLowercase = /[a-z]/.test(trimmed)

  return hasUppercase && hasLowercase
}

function looksLikeBotSubmission({
  name,
  message,
}: {
  name: string
  message: string
}) {
  const cleanName = name.trim()
  const cleanMessage = message.trim()

  const nameLooksRandom = looksRandomSingleToken(cleanName)
  const messageLooksRandom = looksRandomSingleToken(cleanMessage)

  const messageHasNoSpaces = !/\s/.test(cleanMessage)
  const messageIsOnlyLetters = /^[A-Za-z]+$/.test(cleanMessage)
  const messageLooksLikeCode =
    cleanMessage.length >= 14 && messageHasNoSpaces && messageIsOnlyLetters

  return nameLooksRandom || messageLooksRandom || messageLooksLikeCode
}

export async function submitContact(
  _previousState: SubmitContactState,
  formData: FormData
): Promise<SubmitContactState> {
  const language: "en" | "es" =
    formData.get("language") === "es" ? "es" : "en"

  const website = String(formData.get("website") || "")
  const startedAt = Number(formData.get("startedAt") || 0)
  const submittedAt = Date.now()

  if (website.trim().length > 0) {
    return {
      success: false,
      message: getGenericErrorMessage(language),
    }
  }

  if (!startedAt || submittedAt - startedAt < 4000) {
    return {
      success: false,
      message: getGenericErrorMessage(language),
    }
  }

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

  if (
    looksLikeBotSubmission({
      name: data.name,
      message: data.message,
    })
  ) {
    return {
      success: false,
      message: getGenericErrorMessage(language),
    }
  }

  const { error } = await supabaseAdmin.from("contact_messages").insert({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    message: data.message,
    consent_contact: data.consentContact,
    source: language === "es" ? "contact_page_es" : "contact_page_en",
    status: "new",
  })

  if (error) {
    console.error("Contact message insert error:", error)

    return {
      success: false,
      message: getGenericErrorMessage(language),
    }
  }

  const emailData = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
    language,
  }

  if (resend) {
    const parentEmail = await resend.emails.send({
      from: resendFromEmail,
      to: data.email,
      subject:
        language === "es"
          ? "Hemos recibido tu mensaje"
          : "We received your message",
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

  redirect(language === "es" ? "/es/contact/thanks" : "/contact/thanks")
}