"use server"

import { revalidatePath } from "next/cache"

import { assertCapability } from "@/lib/auth/require-capability"
import {
  buildPreconversionLeadUpdates,
  preconversionLeadEditSchema,
} from "@/lib/admin/preconversion-lead-edit.mjs"
import { loadPlannedPlaceEmailDraft } from "@/lib/email/planned-place-email-server"
import { supabaseService } from "@/lib/supabase/service"

function csvList(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
}

export async function updatePreconversionLeadDetails(formData: FormData) {
  await assertCapability("edit_preconversion_leads")

  const parsed = preconversionLeadEditSchema.safeParse({
    parentLeadId: formData.get("parentLeadId"),
    childLeadId: formData.get("childLeadId"),
    timetablePreferenceId: formData.get("timetablePreferenceId"),
    parentName: formData.get("parentName"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    area: formData.get("area") || "",
    source: formData.get("source") || "",
    childFirstName: formData.get("childFirstName"),
    childAge: formData.get("childAge"),
    schoolName: formData.get("schoolName") || "",
    schoolYear: formData.get("schoolYear") || "",
    curriculum: formData.get("curriculum") || "",
    supportNeeds: csvList(formData.get("supportNeeds")),
    notes: formData.get("notes") || "",
    courseOrExamBoard: formData.get("courseOrExamBoard") || "",
    preferredDays: csvList(formData.get("preferredDays")),
    preferredTimes: csvList(formData.get("preferredTimes")),
    preferredFrequency: formData.get("preferredFrequency") || "",
  })

  if (!parsed.success) {
    throw new Error("Please check the parent, child and timetable details")
  }

  const value = parsed.data
  const supabase = supabaseService()

  const { count: learnerCount, error: learnerError } = await supabase
    .from("learners")
    .select("id", { count: "exact", head: true })
    .eq("child_lead_id", value.childLeadId)

  if (learnerError) throw new Error("Could not verify the lead conversion state")
  if (learnerCount) {
    throw new Error(
      "This child is already a learner. Edit their identity in Learner Records instead.",
    )
  }

  const { data: currentChild, error: childError } = await supabase
    .from("child_leads")
    .select("parent_lead_id,planned_email_draft_subject,planned_email_draft_body")
    .eq("id", value.childLeadId)
    .maybeSingle()

  if (
    childError ||
    !currentChild ||
    currentChild.parent_lead_id !== value.parentLeadId
  ) {
    throw new Error("That child does not belong to this family")
  }

  const updates = buildPreconversionLeadUpdates(value)
  const { error } = await supabase.rpc("update_preconversion_lead_details", {
    p_parent_lead_id: value.parentLeadId,
    p_child_lead_id: value.childLeadId,
    p_timetable_preference_id: value.timetablePreferenceId,
    p_parent_name: updates.parent.parent_name,
    p_email: updates.parent.email || "",
    p_phone: updates.parent.phone || "",
    p_area: updates.parent.area || "",
    p_source: updates.parent.source || "",
    p_child_first_name: updates.child.first_name,
    p_child_age: updates.child.child_age,
    p_school_name: updates.child.school_name || "",
    p_school_year: updates.child.school_year || "",
    p_curriculum: updates.child.curriculum || "",
    p_support_needs: updates.child.support_needs,
    p_notes: updates.child.notes || "",
    p_course_or_exam_board: updates.child.course_or_exam_board || "",
    p_preferred_days: updates.timetable.preferred_days,
    p_preferred_times: updates.timetable.preferred_times,
    p_preferred_frequency: updates.timetable.preferred_frequency || "",
  })

  if (error) {
    console.error("Pre-conversion lead edit failed", error)
    throw new Error(
      error.message.includes("Learner Records")
        ? error.message
        : "Could not update the lead details",
    )
  }

  if (
    currentChild.planned_email_draft_subject &&
    currentChild.planned_email_draft_body
  ) {
    const regenerated = await loadPlannedPlaceEmailDraft({
      parentLeadId: value.parentLeadId,
      childLeadId: value.childLeadId,
      useSavedDraft: false,
    })
    const regeneratedAt = new Date().toISOString()
    const { error: draftError } = await supabase
      .from("child_leads")
      .update({
        planned_email_draft_subject: regenerated.subject,
        planned_email_draft_body: regenerated.body,
        planned_email_draft_booking_version: regenerated.bookingVersion,
        planned_email_draft_saved_at: regeneratedAt,
        planned_email_draft_regeneration_notice: true,
        planned_email_draft_regenerated_at: regeneratedAt,
      })
      .eq("id", value.childLeadId)
      .eq("parent_lead_id", value.parentLeadId)

    if (draftError) {
      console.error("Lead saved but planned email draft regeneration failed", draftError)
      throw new Error(
        "Lead details were saved, but the current parent email draft could not be regenerated. Review the email before sending.",
      )
    }
  }

  revalidatePath("/admin/leads")
  revalidatePath("/admin")
}
