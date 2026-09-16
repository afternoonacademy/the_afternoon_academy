"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { supabaseService } from "@/lib/supabase/service"

const learnerSchema = z.object({ firstName: z.string().trim().min(1).max(80), yearGroup: z.string().trim().max(80).optional(), parentLeadId: z.string().uuid().optional(), parentInformationConfirmed: z.literal(true) })
const attendanceSchema = z.object({ learnerId: z.string().uuid(), attendanceDate: z.string().date(), status: z.enum(["present","late","absent","authorised_absence"]), note: z.string().trim().max(500).optional() })
const teacherUpdateSchema = z.object({ learnerId: z.string().uuid(), occurredOn: z.string().date(), whatHappened: z.string().trim().min(2).max(2000), whyItMattered: z.string().trim().min(2).max(2000), nextStep: z.string().trim().min(2).max(2000), parentVisible: z.boolean() })
const items = (formData: FormData, field: string) => String(formData.get(field) || "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12)

export async function createLearner(formData: FormData) {
  await requireAdmin()
  const parsed = learnerSchema.safeParse({ firstName: formData.get("firstName"), yearGroup: formData.get("yearGroup") || undefined, parentLeadId: formData.get("parentLeadId") || undefined, parentInformationConfirmed: formData.get("parentInformationConfirmed") === "on" })
  if (!parsed.success) throw new Error("Please complete the required learner details")
  const supabase = supabaseService()
  const { data: learner, error } = await supabase.from("learners").insert({ first_name: parsed.data.firstName, year_group: parsed.data.yearGroup || null, parent_lead_id: parsed.data.parentLeadId || null, parent_information_confirmed: true }).select("id").single()
  if (error || !learner) throw new Error("Could not create learner record")
  const { error: profileError } = await supabase.from("learner_profiles").insert({ learner_id: learner.id, strengths: items(formData,"strengths"), interests: items(formData,"interests"), barriers: items(formData,"barriers"), parent_priorities: String(formData.get("parentPriorities") || "").trim() || null, helpful_strategies: String(formData.get("helpfulStrategies") || "").trim() || null })
  if (profileError) { await supabase.from("learners").delete().eq("id", learner.id); throw new Error("Could not create learner profile") }
  revalidatePath("/admin/learners"); redirect(`/admin/learners/${learner.id}`)
}

export async function recordAttendance(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = attendanceSchema.safeParse({ learnerId: formData.get("learnerId"), attendanceDate: formData.get("attendanceDate"), status: formData.get("status"), note: formData.get("note") || undefined })
  if (!parsed.success) throw new Error("Please check the attendance details")
  const { error } = await supabaseService().from("attendance_records").upsert({ learner_id: parsed.data.learnerId, attendance_date: parsed.data.attendanceDate, status: parsed.data.status, note: parsed.data.note || null, recorded_by: user.id }, { onConflict: "learner_id,attendance_date" })
  if (error) throw new Error("Could not save attendance")
  revalidatePath(`/admin/learners/${parsed.data.learnerId}`)
}

export async function createTeacherUpdate(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = teacherUpdateSchema.safeParse({ learnerId: formData.get("learnerId"), occurredOn: formData.get("occurredOn"), whatHappened: formData.get("whatHappened"), whyItMattered: formData.get("whyItMattered"), nextStep: formData.get("nextStep"), parentVisible: formData.get("parentVisible") === "on" })
  if (!parsed.success) throw new Error("Please complete the teacher update")
  const { error } = await supabaseService().from("teacher_updates").insert({ learner_id: parsed.data.learnerId, occurred_on: parsed.data.occurredOn, what_happened: parsed.data.whatHappened, why_it_mattered: parsed.data.whyItMattered, next_step: parsed.data.nextStep, parent_visible: parsed.data.parentVisible, author_id: user.id })
  if (error) throw new Error("Could not save teacher update")
  revalidatePath(`/admin/learners/${parsed.data.learnerId}`)
}
