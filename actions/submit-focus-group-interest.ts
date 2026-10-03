"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { adminLeadEmail, resend, resendFromEmail } from "@/lib/email/resend"
import {
  focusGroupAdminNotificationEmailHtml,
  focusGroupAdminNotificationEmailText,
  focusGroupInterestConfirmationEmailHtml,
  focusGroupInterestConfirmationEmailText,
} from "@/lib/email/templates"
import { supabaseAdmin } from "@/lib/supabase/admin"

export type FocusGroupInterestState = { success: boolean; message: string }

const schema = z.object({
  language: z.enum(["en", "es"]),
  parentName: z.string().trim().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().trim().min(6, "Please enter a contact number"),
  childFirstName: z.string().trim().min(1, "Please enter the student's first name").max(80),
  schoolName: z.string().trim().min(1, "Please enter the student's school"),
  schoolYear: z.enum(["Year 10", "Year 11"]),
  preferredSession: z.enum(["17:00-17:50", "18:00-18:50", "either"]),
  notes: z.string().trim().max(2000).optional(),
  consentContact: z.literal(true, { message: "Please confirm that we may contact you about this enquiry" }),
})

export async function submitFocusGroupInterest(
  _previousState: FocusGroupInterestState,
  formData: FormData,
): Promise<FocusGroupInterestState> {
  const parsed = schema.safeParse({
    language: formData.get("language") === "es" ? "es" : "en",
    parentName: formData.get("parentName"), email: formData.get("email"), phone: formData.get("phone"),
    childFirstName: formData.get("childFirstName"), schoolName: formData.get("schoolName"), schoolYear: formData.get("schoolYear"),
    preferredSession: formData.get("preferredSession"),
    notes: formData.get("notes") || undefined, consentContact: formData.get("consentContact") === "on",
  })
  if (!parsed.success) {
    const language = formData.get("language") === "es" ? "es" : "en"
    return {
      success: false,
      message:
        language === "es"
          ? "Revisa el formulario e inténtalo de nuevo."
          : parsed.error.issues[0]?.message || "Please check the form.",
    }
  }
  const data = parsed.data
  const { data: parent, error: parentError } = await supabaseAdmin.from("parent_leads").insert({
    parent_name: data.parentName, email: data.email, phone: data.phone, school_name: data.schoolName,
    interest_level: "very_interested", consent_contact: true, source: data.language === "es" ? "focus_group_igcse_chemistry_es" : "focus_group_igcse_chemistry", status: "new", enquiry_type: "focus_group",
  }).select("id").single()
  if (parentError || !parent) {
    return {
      success: false,
      message:
        data.language === "es"
          ? "No hemos podido guardar tu solicitud. Inténtalo de nuevo."
          : "We could not save your enquiry. Please try again.",
    }
  }
  const { data: child, error: childError } = await supabaseAdmin.from("child_leads").insert({
    parent_lead_id: parent.id, first_name: data.childFirstName, school_year: data.schoolYear, curriculum: "british",
    support_needs: ["igcse_chemistry"], notes: data.notes || null, focus_group_code: "igcse_chemistry",
    focus_group_preferred_session: data.preferredSession,
  }).select("id").single()
  if (childError || !child) {
    await supabaseAdmin.from("parent_leads").delete().eq("id", parent.id)
    return {
      success: false,
      message:
        data.language === "es"
          ? "No hemos podido guardar los datos del alumno/a. Inténtalo de nuevo."
          : "We could not save the student's details. Please try again.",
    }
  }
  const preferredTimes = data.preferredSession === "either" ? ["17:00-17:50", "18:00-18:50"] : [data.preferredSession]
  const { error: timingError } = await supabaseAdmin.from("timetable_preferences").insert({ child_lead_id: child.id, preferred_days: [], preferred_times: preferredTimes, preferred_frequency: "not_sure" })
  if (timingError) {
    await supabaseAdmin.from("parent_leads").delete().eq("id", parent.id)
    return {
      success: false,
      message:
        data.language === "es"
          ? "No hemos podido guardar tu preferencia de horario. Inténtalo de nuevo."
          : "We could not save your session preference. Please try again.",
    }
  }

  const emailData = {
    parentName: data.parentName,
    email: data.email,
    phone: data.phone,
    childFirstName: data.childFirstName,
    schoolName: data.schoolName,
    schoolYear: data.schoolYear,
    preferredSession: data.preferredSession,
    notes: data.notes,
    language: data.language,
  }

  if (resend) {
    const parentEmail = await resend.emails.send({
      from: resendFromEmail,
      to: data.email,
      subject:
        data.language === "es"
          ? "Hemos recibido tu registro de interés en Química IGCSE"
          : "We received your IGCSE Chemistry interest registration",
      html: focusGroupInterestConfirmationEmailHtml(emailData),
      text: focusGroupInterestConfirmationEmailText(emailData),
    })

    if (parentEmail.error) {
      console.error("Focus Group parent confirmation email error:", parentEmail.error)
    }

    if (adminLeadEmail) {
      const adminEmail = await resend.emails.send({
        from: resendFromEmail,
        to: adminLeadEmail,
        replyTo: data.email,
        subject: `New IGCSE Chemistry Focus Group enquiry: ${data.parentName}`,
        html: focusGroupAdminNotificationEmailHtml(emailData),
        text: focusGroupAdminNotificationEmailText(emailData),
      })

      if (adminEmail.error) {
        console.error("Focus Group admin notification email error:", adminEmail.error)
      }
    }
  } else {
    console.warn("Resend is not configured. Skipping Focus Group interest emails.")
  }

  redirect(
    data.language === "es"
      ? "/es/gracias?enquiry=igcse-chemistry"
      : "/thank-you?enquiry=igcse-chemistry",
  )
}
