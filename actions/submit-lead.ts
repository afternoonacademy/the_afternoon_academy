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
  formData: FormData,
): Promise<SubmitLeadState> {
  const language: "en" | "es" =
    formData.get("language") === "es" ? "es" : "en"

  let children: unknown
  try {
    children = JSON.parse(String(formData.get("children") || "[]"))
  } catch {
    return {
      success: false,
      message:
        language === "es"
          ? "Revisa los datos de cada niño/a."
          : "Please check each child’s details.",
    }
  }

  const parsed = leadFormSchema.safeParse({
    parentName: formData.get("parentName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    area: formData.get("area") || undefined,
    children,
    interestLevel: formData.get("interestLevel"),
    consentContact: formData.get("consentContact") === "on",
  })

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ||
        (language === "es"
          ? "Revisa el formulario e inténtalo de nuevo."
          : "Please check the form and try again."),
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
      school_name: data.children[0]?.schoolName || null,
      interest_level: data.interestLevel,
      consent_contact: data.consentContact,
      source: language === "es" ? "landing_page_es" : "landing_page_en",
      status: "new",
    })
    .select("id")
    .single()

  if (parentError || !parentLead) {
    console.error("Parent lead insert error:", parentError)
    return {
      success: false,
      message:
        language === "es"
          ? "Ha ocurrido un error al guardar tus datos. Inténtalo de nuevo."
          : "Something went wrong while saving your details. Please try again.",
    }
  }

  const { data: childLeads, error: childError } = await supabaseAdmin
    .from("child_leads")
    .insert(
      data.children.map((child) => ({
        parent_lead_id: parentLead.id,
        first_name: child.firstName,
        child_age: child.age,
        school_name: child.schoolName || null,
        school_year: child.schoolYear || null,
        curriculum: child.curriculum,
        support_needs: child.supportNeeds,
        course_or_exam_board:
          child.supportNeeds.includes("igcse_chemistry")
            ? child.courseOrExamBoard || null
            : null,
        notes: child.notes || null,
      })),
    )
    .select("id")

  if (childError || !childLeads || childLeads.length !== data.children.length) {
    await supabaseAdmin.from("parent_leads").delete().eq("id", parentLead.id)
    console.error("Child lead insert error:", childError)
    return {
      success: false,
      message:
        language === "es"
          ? "Ha ocurrido un error al guardar los datos de los niños/as. Inténtalo de nuevo."
          : "Something went wrong while saving the child details. Please try again.",
    }
  }

  const { error: timetableError } = await supabaseAdmin
    .from("timetable_preferences")
    .insert(
      childLeads.map((childLead, index) => ({
        child_lead_id: childLead.id,
        preferred_days: data.children[index].preferredDays,
        preferred_times: data.children[index].preferredTimes,
        preferred_frequency: data.children[index].preferredFrequency,
      })),
    )

  if (timetableError) {
    await supabaseAdmin.from("parent_leads").delete().eq("id", parentLead.id)
    console.error("Timetable preference insert error:", timetableError)
    return {
      success: false,
      message:
        language === "es"
          ? "Ha ocurrido un error al guardar tu solicitud de plaza. Inténtalo de nuevo."
          : "Something went wrong while saving your place enquiry. Please try again.",
    }
  }

  const emailData = {
    parentName: data.parentName,
    email: data.email,
    phone: data.phone,
    area: data.area,
    children: data.children,
    interestLevel: data.interestLevel,
    language,
  }

  if (resend) {
    const parentSubject =
      language === "es"
        ? "Hemos recibido tu solicitud de plaza"
        : "We received your Afternoon Academy place enquiry"
    const parentText = parentConfirmationEmailText(emailData)
    const idempotencyKey = "enquiry-acknowledgement-" + parentLead.id

    const { data: deliveryLog } = await supabaseAdmin
      .from("email_delivery_log")
      .insert({
        parent_lead_id: parentLead.id,
        email_kind: "enquiry_acknowledgement",
        recipient_email: data.email,
        idempotency_key: idempotencyKey,
        subject: parentSubject,
        body_text: parentText,
      })
      .select("id")
      .single()

    const parentEmail = await resend.emails.send(
      {
        from: resendFromEmail,
        to: data.email,
        subject: parentSubject,
        html: parentConfirmationEmailHtml(emailData),
        text: parentText,
      },
      { headers: { "Idempotency-Key": idempotencyKey } },
    )

    if (parentEmail.error) {
      console.error("Parent confirmation email error:", parentEmail.error)
      if (deliveryLog) {
        await supabaseAdmin
          .from("email_delivery_log")
          .update({
            status: "failed",
            failed_at: new Date().toISOString(),
            error_message: parentEmail.error.message.slice(0, 500),
          })
          .eq("id", deliveryLog.id)
      }
    } else if (deliveryLog) {
      await supabaseAdmin
        .from("email_delivery_log")
        .update({
          status: "sent",
          resend_email_id: parentEmail.data?.id || null,
          sent_at: new Date().toISOString(),
        })
        .eq("id", deliveryLog.id)
    }

    if (adminLeadEmail) {
      const adminEmail = await resend.emails.send({
        from: resendFromEmail,
        to: adminLeadEmail,
        replyTo: data.email,
        subject: "New Afternoon Academy place enquiry: " + data.parentName,
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

  redirect(language === "es" ? "/es/gracias" : "/thank-you")
}
