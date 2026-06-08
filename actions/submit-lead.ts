"use server"

import { redirect } from "next/navigation"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { adminLeadEmail, resend, resendFromEmail } from "@/lib/email/resend"
import {
  adminLeadNotificationEmailHtml,
  adminLeadNotificationEmailText,
  parentConfirmationEmailHtml,
  parentConfirmationEmailText,
} from "@/lib/email/templates"
import { leadFormSchema } from "@/lib/validations/lead"

export type SubmitLeadState = {
  success: boolean
  message: string
}

export async function submitLead(
  _previousState: SubmitLeadState,
  formData: FormData
): Promise<SubmitLeadState> {
  const rawData = {
    parentName: formData.get("parentName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    area: formData.get("area") || undefined,
    schoolName: formData.get("schoolName") || undefined,

    childAge: formData.get("childAge"),
    schoolYear: formData.get("schoolYear") || undefined,
    curriculum: formData.get("curriculum"),

    supportNeeds: formData.getAll("supportNeeds"),

    preferredDays: formData.getAll("preferredDays"),
    preferredTimes: formData.getAll("preferredTimes"),
    preferredFrequency: formData.get("preferredFrequency"),

    interestLevel: formData.get("interestLevel"),
    notes: formData.get("notes") || undefined,

    consentContact: formData.get("consentContact") === "on",
  }

  const parsed = leadFormSchema.safeParse(rawData)

  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message || "Please check the form and try again."

    return {
      success: false,
      message: firstError,
    }
  }

  const data = parsed.data

  const { data: parentLead, error: parentError } = await supabaseAdmin
    .from("parent_leads")
    .insert({
      parent_name: data.parentName,
      email: data.email,
      phone: data.phone,
      area: data.area || null,
      school_name: data.schoolName || null,
      interest_level: data.interestLevel,
      consent_contact: data.consentContact,
      source: "landing_page",
      status:
        data.interestLevel === "priority_launch" ||
        data.interestLevel === "very_interested"
          ? "priority"
          : "new",
    })
    .select("id")
    .single()

  if (parentError || !parentLead) {
    console.error("Parent lead insert error:", parentError)

    return {
      success: false,
      message: "Something went wrong while saving your details. Please try again.",
    }
  }

  const { data: childLead, error: childError } = await supabaseAdmin
    .from("child_leads")
    .insert({
      parent_lead_id: parentLead.id,
      child_age: data.childAge,
      school_year: data.schoolYear || null,
      curriculum: data.curriculum,
      support_needs: data.supportNeeds,
      notes: data.notes || null,
    })
    .select("id")
    .single()

  if (childError || !childLead) {
    console.error("Child lead insert error:", childError)

    return {
      success: false,
      message: "Something went wrong while saving the child details. Please try again.",
    }
  }

  const { error: timetableError } = await supabaseAdmin
    .from("timetable_preferences")
    .insert({
      child_lead_id: childLead.id,
      preferred_days: data.preferredDays,
      preferred_times: data.preferredTimes,
      preferred_frequency: data.preferredFrequency,
    })

  if (timetableError) {
    console.error("Timetable preference insert error:", timetableError)

    return {
      success: false,
      message:
        "Something went wrong while saving timetable preferences. Please try again.",
    }
  }

  const emailData = {
    parentName: data.parentName,
    email: data.email,
    phone: data.phone,
    area: data.area,
    schoolName: data.schoolName,

    childAge: data.childAge,
    schoolYear: data.schoolYear,
    curriculum: data.curriculum,
    supportNeeds: data.supportNeeds,

    preferredDays: data.preferredDays,
    preferredTimes: data.preferredTimes,
    preferredFrequency: data.preferredFrequency,
    interestLevel: data.interestLevel,

    notes: data.notes,
  }

  if (resend) {
    const parentEmail = await resend.emails.send({
      from: resendFromEmail,
      to: data.email,
      subject: "We received your Afternoon Academy timetable preferences",
      html: parentConfirmationEmailHtml(emailData),
      text: parentConfirmationEmailText(emailData),
    })

    if (parentEmail.error) {
      console.error("Parent confirmation email error:", parentEmail.error)
    }

    if (adminLeadEmail) {
      const adminEmail = await resend.emails.send({
        from: resendFromEmail,
        to: adminLeadEmail,
        replyTo: data.email,
        subject: `New Afternoon Academy lead: ${data.parentName}`,
        html: adminLeadNotificationEmailHtml(emailData),
        text: adminLeadNotificationEmailText(emailData),
      })

      if (adminEmail.error) {
        console.error("Admin lead notification email error:", adminEmail.error)
      }
    }
  } else {
    console.warn("Resend is not configured. Skipping lead emails.")
  }

  redirect("/thank-you")
}