"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import { supabaseService } from "@/lib/supabase/service"

const learnerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  yearGroup: z.string().trim().max(80).optional(),
  parentLeadId: z.string().uuid().optional(),
  parentInformationConfirmed: z.literal(true),
})

const learnerDetailsSchema = z.object({
  learnerId: z.string().uuid(),
  status: z.enum(["active", "paused", "left"]),
  currentSchoolName: z.string().trim().max(160).optional(),
  teacherName: z.string().trim().max(160).optional(),
  teacherEmail: z.union([z.string().trim().email().max(254), z.literal("")]),
  teacherPhone: z.string().trim().max(50).optional(),
  schoolContactPermissionConfirmed: z.boolean(),
})

const attendanceSchema = z.object({
  learnerId: z.string().uuid(),
  attendanceDate: z.string().date(),
  status: z.enum(["present", "late", "absent", "authorised_absence"]),
  note: z.string().trim().max(500).optional(),
})

const teacherUpdateSchema = z.object({
  learnerId: z.string().uuid(),
  occurredOn: z.string().date(),
  whatHappened: z.string().trim().min(2).max(2000),
  whyItMattered: z.string().trim().min(2).max(2000),
  nextStep: z.string().trim().min(2).max(2000),
  parentVisible: z.boolean(),
})

const learnerGoalSchema = z.object({
  learnerId: z.string().uuid(),
  title: z.string().trim().min(2).max(300),
  domain: z.enum(["academic", "confidence", "independence", "participation"]),
  evidence: z.string().trim().max(2000).optional(),
  targetDate: z.string().date().optional(),
})

const learnerGoalStatusSchema = z.object({
  learnerId: z.string().uuid(),
  goalId: z.string().uuid(),
  status: z.enum(["active", "achieved", "paused"]),
})

function listFromForm(formData: FormData, field: string) {
  return String(formData.get(field) || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
}

export async function createLearner(formData: FormData) {
  await requireAdmin()

  const parsed = learnerSchema.safeParse({
    firstName: formData.get("firstName"),
    yearGroup: formData.get("yearGroup") || undefined,
    parentLeadId: formData.get("parentLeadId") || undefined,
    parentInformationConfirmed: formData.get("parentInformationConfirmed") === "on",
  })

  if (!parsed.success) throw new Error("Please complete the required learner details")

  const supabase = supabaseService()
  const { data: learner, error: learnerError } = await supabase
    .from("learners")
    .insert({
      first_name: parsed.data.firstName,
      year_group: parsed.data.yearGroup || null,
      parent_lead_id: parsed.data.parentLeadId || null,
      parent_information_confirmed: true,
    })
    .select("id")
    .single()

  if (learnerError || !learner) {
    console.error("Learner creation failed:", learnerError)
    throw new Error("Could not create learner record")
  }

  const { error: profileError } = await supabase.from("learner_profiles").insert({
    learner_id: learner.id,
    strengths: listFromForm(formData, "strengths"),
    interests: listFromForm(formData, "interests"),
    barriers: listFromForm(formData, "barriers"),
    parent_priorities: String(formData.get("parentPriorities") || "").trim() || null,
    helpful_strategies: String(formData.get("helpfulStrategies") || "").trim() || null,
  })

  if (profileError) {
    await supabase.from("learners").delete().eq("id", learner.id)
    console.error("Learner profile creation failed:", profileError)
    throw new Error("Could not create learner profile")
  }

  revalidatePath("/admin/learners")
  redirect(`/admin/learners/${learner.id}`)
}

export async function updateLearnerDetails(formData: FormData) {
  await requireAdmin()
  const parsed = learnerDetailsSchema.safeParse({
    learnerId: formData.get("learnerId"),
    status: formData.get("status"),
    currentSchoolName: formData.get("currentSchoolName") || undefined,
    teacherName: formData.get("teacherName") || undefined,
    teacherEmail: formData.get("teacherEmail") || "",
    teacherPhone: formData.get("teacherPhone") || undefined,
    schoolContactPermissionConfirmed: formData.get("schoolContactPermissionConfirmed") === "on",
  })

  if (!parsed.success) throw new Error("Please check the learner details")

  const details = parsed.data
  const hasSchoolContact = Boolean(details.teacherName || details.teacherEmail || details.teacherPhone)
  if (hasSchoolContact && !details.schoolContactPermissionConfirmed) {
    throw new Error("Confirm permission before recording school contact details")
  }

  const { error } = await supabaseService().from("learners").update({
    status: details.status,
    current_school_name: details.currentSchoolName || null,
    teacher_name: details.teacherName || null,
    teacher_email: details.teacherEmail || null,
    teacher_phone: details.teacherPhone || null,
    school_contact_permission_confirmed: details.schoolContactPermissionConfirmed,
  }).eq("id", details.learnerId)

  if (error) throw new Error("Could not update learner details")
  revalidatePath("/admin/learners")
  revalidatePath(`/admin/learners/${details.learnerId}`)
  revalidatePath("/admin/operations")
}

export async function recordAttendance(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = attendanceSchema.safeParse({
    learnerId: formData.get("learnerId"),
    attendanceDate: formData.get("attendanceDate"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  })

  if (!parsed.success) throw new Error("Please check the attendance details")

  const supabase = supabaseService()
  const { error } = await supabase.from("attendance_records").upsert(
    {
      learner_id: parsed.data.learnerId,
      attendance_date: parsed.data.attendanceDate,
      status: parsed.data.status,
      note: parsed.data.note || null,
      recorded_by: user.id,
    },
    { onConflict: "learner_id,attendance_date" }
  )

  if (error) throw new Error("Could not save attendance")
  revalidatePath(`/admin/learners/${parsed.data.learnerId}`)
  revalidatePath("/admin/operations")
}

export async function createTeacherUpdate(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = teacherUpdateSchema.safeParse({
    learnerId: formData.get("learnerId"),
    occurredOn: formData.get("occurredOn"),
    whatHappened: formData.get("whatHappened"),
    whyItMattered: formData.get("whyItMattered"),
    nextStep: formData.get("nextStep"),
    parentVisible: formData.get("parentVisible") === "on",
  })

  if (!parsed.success) throw new Error("Please complete the teacher update")

  const supabase = supabaseService()
  const { error } = await supabase.from("teacher_updates").insert({
    learner_id: parsed.data.learnerId,
    occurred_on: parsed.data.occurredOn,
    what_happened: parsed.data.whatHappened,
    why_it_mattered: parsed.data.whyItMattered,
    next_step: parsed.data.nextStep,
    parent_visible: parsed.data.parentVisible,
    author_id: user.id,
  })

  if (error) throw new Error("Could not save teacher update")
  revalidatePath(`/admin/learners/${parsed.data.learnerId}`)
  revalidatePath("/admin/operations")
}

export async function createLearnerGoal(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = learnerGoalSchema.safeParse({
    learnerId: formData.get("learnerId"),
    title: formData.get("title"),
    domain: formData.get("domain"),
    evidence: formData.get("evidence") || undefined,
    targetDate: formData.get("targetDate") || undefined,
  })

  if (!parsed.success) throw new Error("Please check the goal details")

  const { error } = await supabaseService().from("learner_goals").insert({
    learner_id: parsed.data.learnerId,
    title: parsed.data.title,
    domain: parsed.data.domain,
    evidence: parsed.data.evidence || null,
    target_date: parsed.data.targetDate || null,
    created_by: user.id,
  })

  if (error) throw new Error("Could not create learner goal")
  revalidatePath(`/admin/learners/${parsed.data.learnerId}`)
  revalidatePath("/admin/operations")
}

export async function updateLearnerGoalStatus(formData: FormData) {
  await requireAdmin()
  const parsed = learnerGoalStatusSchema.safeParse({
    learnerId: formData.get("learnerId"),
    goalId: formData.get("goalId"),
    status: formData.get("status"),
  })

  if (!parsed.success) throw new Error("Please check the goal status")

  const { error } = await supabaseService().from("learner_goals")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.goalId)
    .eq("learner_id", parsed.data.learnerId)

  if (error) throw new Error("Could not update learner goal")
  revalidatePath(`/admin/learners/${parsed.data.learnerId}`)
  revalidatePath("/admin/operations")
}
