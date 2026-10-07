"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { assertCapability } from "@/lib/auth/require-capability"
import { validateLearnerFrameworkAssignment } from "@/lib/teaching/learner-frameworks.mjs"
import { supabaseService } from "@/lib/supabase/service"

const assignmentSchema = z.object({
  learnerId: z.string().uuid(),
  frameworkId: z.string().uuid(),
  startsOn: z.string().date(),
  endsOn: z.union([z.string().date(), z.literal("")]).optional(),
  curriculumCourse: z.string().trim().max(300).optional(),
  examBoard: z.string().trim().max(160).optional(),
  currentUnitTopic: z.string().trim().max(500).optional(),
  learnerObjectives: z.string().trim().max(4000).optional(),
  teacherContext: z.string().trim().max(4000).optional(),
  isDefault: z.boolean(),
})

const updateSchema = assignmentSchema.extend({
  assignmentId: z.string().uuid(),
  status: z.enum(["active", "paused", "ended"]),
})

const idSchema = z.object({
  learnerId: z.string().uuid(),
  assignmentId: z.string().uuid(),
})

function nullable(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null
}

async function clearDefaultForLearner(
  supabase: ReturnType<typeof supabaseService>,
  learnerId: string,
  exceptId?: string,
) {
  let query = supabase
    .from("learner_teaching_frameworks")
    .update({ is_default: false })
    .eq("learner_id", learnerId)
    .eq("is_default", true)

  if (exceptId) query = query.neq("id", exceptId)
  const { error } = await query
  if (error) throw new Error("Could not update the learner's default framework")
}

export async function createLearnerFrameworkAssignment(formData: FormData) {
  const { internalUser } = await assertCapability("edit_learning_record")
  const parsed = assignmentSchema.safeParse({
    learnerId: formData.get("learnerId"),
    frameworkId: formData.get("frameworkId"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn") || "",
    curriculumCourse: formData.get("curriculumCourse") || undefined,
    examBoard: formData.get("examBoard") || undefined,
    currentUnitTopic: formData.get("currentUnitTopic") || undefined,
    learnerObjectives: formData.get("learnerObjectives") || undefined,
    teacherContext: formData.get("teacherContext") || undefined,
    isDefault: formData.get("isDefault") === "on",
  })
  if (!parsed.success) throw new Error("Please check the teaching context details")

  validateLearnerFrameworkAssignment({
    status: "active",
    startsOn: parsed.data.startsOn,
    endsOn: parsed.data.endsOn || null,
    isDefault: parsed.data.isDefault,
  })

  const supabase = supabaseService()
  const { data: framework, error: frameworkError } = await supabase
    .from("teaching_frameworks")
    .select("id,status,current_version_id")
    .eq("id", parsed.data.frameworkId)
    .maybeSingle()

  if (
    frameworkError ||
    !framework ||
    framework.status !== "published" ||
    !framework.current_version_id
  ) {
    throw new Error("Choose a published teaching framework")
  }

  if (parsed.data.isDefault) {
    await clearDefaultForLearner(supabase, parsed.data.learnerId)
  }

  const { error } = await supabase.from("learner_teaching_frameworks").insert({
    learner_id: parsed.data.learnerId,
    framework_id: framework.id,
    framework_version_id: framework.current_version_id,
    status: "active",
    starts_on: parsed.data.startsOn,
    ends_on: parsed.data.endsOn || null,
    is_default: parsed.data.isDefault,
    curriculum_course: nullable(parsed.data.curriculumCourse),
    exam_board: nullable(parsed.data.examBoard),
    current_unit_topic: nullable(parsed.data.currentUnitTopic),
    learner_objectives: nullable(parsed.data.learnerObjectives),
    teacher_context: nullable(parsed.data.teacherContext),
    created_by: internalUser.id,
    updated_by: internalUser.id,
  })

  if (error) throw new Error("Could not add the learner teaching context")
  revalidatePath("/admin/learners/" + parsed.data.learnerId)
  revalidatePath("/admin/learners/" + parsed.data.learnerId + "/teaching-context")
}

export async function updateLearnerFrameworkAssignment(formData: FormData) {
  const { internalUser } = await assertCapability("edit_learning_record")
  const parsed = updateSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    learnerId: formData.get("learnerId"),
    frameworkId: formData.get("frameworkId"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn") || "",
    curriculumCourse: formData.get("curriculumCourse") || undefined,
    examBoard: formData.get("examBoard") || undefined,
    currentUnitTopic: formData.get("currentUnitTopic") || undefined,
    learnerObjectives: formData.get("learnerObjectives") || undefined,
    teacherContext: formData.get("teacherContext") || undefined,
    isDefault: formData.get("isDefault") === "on",
    status: formData.get("status"),
  })
  if (!parsed.success) throw new Error("Please check the teaching context details")

  validateLearnerFrameworkAssignment({
    status: parsed.data.status,
    startsOn: parsed.data.startsOn,
    endsOn: parsed.data.endsOn || null,
    isDefault: parsed.data.isDefault,
  })

  const supabase = supabaseService()
  if (parsed.data.isDefault) {
    await clearDefaultForLearner(supabase, parsed.data.learnerId, parsed.data.assignmentId)
  }

  const { error } = await supabase
    .from("learner_teaching_frameworks")
    .update({
      status: parsed.data.status,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn || null,
      is_default: parsed.data.status === "active" ? parsed.data.isDefault : false,
      curriculum_course: nullable(parsed.data.curriculumCourse),
      exam_board: nullable(parsed.data.examBoard),
      current_unit_topic: nullable(parsed.data.currentUnitTopic),
      learner_objectives: nullable(parsed.data.learnerObjectives),
      teacher_context: nullable(parsed.data.teacherContext),
      updated_by: internalUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.assignmentId)
    .eq("learner_id", parsed.data.learnerId)

  if (error) throw new Error("Could not update the learner teaching context")
  revalidatePath("/admin/learners/" + parsed.data.learnerId)
  revalidatePath("/admin/learners/" + parsed.data.learnerId + "/teaching-context")
}

export async function setDefaultLearnerFramework(formData: FormData) {
  const { internalUser } = await assertCapability("edit_learning_record")
  const parsed = idSchema.safeParse({
    learnerId: formData.get("learnerId"),
    assignmentId: formData.get("assignmentId"),
  })
  if (!parsed.success) throw new Error("Teaching context could not be identified")

  const supabase = supabaseService()
  const { data: assignment, error: readError } = await supabase
    .from("learner_teaching_frameworks")
    .select("id,status")
    .eq("id", parsed.data.assignmentId)
    .eq("learner_id", parsed.data.learnerId)
    .maybeSingle()

  if (readError || !assignment || assignment.status !== "active") {
    throw new Error("Only an active teaching context can be the default")
  }

  await clearDefaultForLearner(supabase, parsed.data.learnerId, parsed.data.assignmentId)
  const { error } = await supabase
    .from("learner_teaching_frameworks")
    .update({
      is_default: true,
      updated_by: internalUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.assignmentId)

  if (error) throw new Error("Could not set the default teaching context")
  revalidatePath("/admin/learners/" + parsed.data.learnerId)
  revalidatePath("/admin/learners/" + parsed.data.learnerId + "/teaching-context")
}

export async function endLearnerFrameworkAssignment(formData: FormData) {
  const { internalUser } = await assertCapability("edit_learning_record")
  const parsed = idSchema.safeParse({
    learnerId: formData.get("learnerId"),
    assignmentId: formData.get("assignmentId"),
  })
  if (!parsed.success) throw new Error("Teaching context could not be identified")

  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabaseService()
    .from("learner_teaching_frameworks")
    .update({
      status: "ended",
      ends_on: today,
      is_default: false,
      updated_by: internalUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.assignmentId)
    .eq("learner_id", parsed.data.learnerId)

  if (error) throw new Error("Could not end the teaching context")
  revalidatePath("/admin/learners/" + parsed.data.learnerId)
  revalidatePath("/admin/learners/" + parsed.data.learnerId + "/teaching-context")
}
