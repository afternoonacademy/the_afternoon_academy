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
  sessionId: z.string().uuid().optional(),
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

const sessionSchema = z.object({
  name: z.string().trim().min(2).max(160),
  focus: z.string().trim().max(500).optional(),
  ageRange: z.string().trim().max(80).optional(),
  weekday: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  teacherName: z.string().trim().max(160).optional(),
  roomName: z.string().trim().max(100).optional(),
  capacity: z.coerce.number().int().min(1).max(40),
  tableNumber: z.coerce.number().int().min(1).max(2).optional(),
  status: z.enum(["planning", "open", "paused", "closed"]),
})

const placementSchema = z.object({
  sessionId: z.string().uuid(),
  learnerId: z.string().uuid(),
  status: z.enum(["proposed", "waitlisted", "ended"]),
  fitNote: z.string().trim().max(1000).optional(),
})

const placementActionSchema = z.object({
  placementId: z.string().uuid(),
})

const leadOfferSchema = z.object({
  sessionId: z.string().uuid(),
  parentLeadId: z.string().uuid(),
  learnerFirstName: z.string().trim().min(1).max(80),
  learnerYearGroup: z.string().trim().max(80).optional(),
  seatNumber: z.coerce.number().int().min(1).max(6).optional(),
  fitNote: z.string().trim().max(1000).optional(),
})

const offerActionSchema = z.object({ offerId: z.string().uuid() })
const sessionOverrideSchema = z.object({
  sessionId: z.string().uuid(),
  serviceDate: z.string().date(),
  teacherName: z.string().trim().max(160).optional(),
  focus: z.string().trim().max(500).optional(),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  durationMinutes: z.coerce.number().int().min(15).max(360).optional(),
})

const removeSessionOverrideSchema = z.object({
  sessionId: z.string().uuid(),
  serviceDate: z.string().date(),
})

const tutorBookingSchema = z.object({
  learnerId: z.string().uuid().optional(), parentLeadId: z.string().uuid().optional(),
  teacherName: z.string().trim().min(1).max(160), startsAt: z.string().min(16).max(40), endsAt: z.string().min(16).max(40), note: z.string().trim().max(1000).optional(),
}).refine((value) => value.learnerId || value.parentLeadId, { message: "Choose a learner or a parent lead" })

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
      status: parsed.data.parentLeadId ? "paused" : "active",
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

  const supabase = supabaseService()
  const { data: learner, error: learnerError } = await supabase
    .from("learners")
    .select("parent_lead_id")
    .eq("id", details.learnerId)
    .single()

  if (learnerError || !learner) throw new Error("Learner record not found")

  if (details.status === "active" && learner.parent_lead_id) {
    const { count, error: placementError } = await supabase
      .from("session_placements")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", details.learnerId)
      .eq("status", "confirmed")

    if (placementError) throw new Error("Could not verify the learner placement")
    if (!count) {
      throw new Error("A learner linked to an enquiry becomes active when a parent accepts a confirmed session offer")
    }
  }

  const { error } = await supabase.from("learners").update({
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
  revalidatePath("/admin/sessions")
}

export async function recordAttendance(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = attendanceSchema.safeParse({
    learnerId: formData.get("learnerId"),
    attendanceDate: formData.get("attendanceDate"),
    status: formData.get("status"),
    sessionId: formData.get("sessionId") || undefined,
    note: formData.get("note") || undefined,
  })

  if (!parsed.success) throw new Error("Please check the attendance details")

  const supabase = supabaseService()
  const { error } = await supabase.from("attendance_records").upsert(
    {
      learner_id: parsed.data.learnerId,
      attendance_date: parsed.data.attendanceDate,
      status: parsed.data.status,
      session_id: parsed.data.sessionId || null,
      note: parsed.data.note || null,
      recorded_by: user.id,
    },
    { onConflict: "learner_id,attendance_date" }
  )

  if (error) throw new Error("Could not save attendance")
  revalidatePath(`/admin/learners/${parsed.data.learnerId}`)
  revalidatePath("/admin/operations")
  revalidatePath("/admin/sessions")
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

export async function createAcademySession(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = sessionSchema.safeParse({
    name: formData.get("name"), focus: formData.get("focus") || undefined, ageRange: formData.get("ageRange") || undefined,
    weekday: formData.get("weekday"), startsAt: formData.get("startsAt"), durationMinutes: formData.get("durationMinutes"),
    teacherName: formData.get("teacherName") || undefined, roomName: formData.get("roomName") || undefined,
    capacity: formData.get("capacity"), tableNumber: formData.get("tableNumber") || undefined, status: formData.get("status"),
  })
  if (!parsed.success) throw new Error("Please check the session details")
  const { error } = await supabaseService().from("academy_sessions").insert({
    name: parsed.data.name, focus: parsed.data.focus || null, age_range: parsed.data.ageRange || null,
    weekday: parsed.data.weekday, starts_at: parsed.data.startsAt, duration_minutes: parsed.data.durationMinutes,
    teacher_name: parsed.data.teacherName || null, room_name: parsed.data.roomName || null, capacity: parsed.data.capacity,
    table_number: parsed.data.tableNumber || null, status: parsed.data.status, created_by: user.id,
  })
  if (error) throw new Error("Could not create session")
  revalidatePath("/admin/sessions")
  revalidatePath("/admin/operations")
}

export async function saveSessionPlacement(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = placementSchema.safeParse({ sessionId: formData.get("sessionId"), learnerId: formData.get("learnerId"), status: formData.get("status"), fitNote: formData.get("fitNote") || undefined })
  if (!parsed.success) throw new Error("Please check the placement details")
  const supabase = supabaseService()
  const { data: existing, error: existingError } = await supabase
    .from("session_placements")
    .select("id, status")
    .eq("session_id", parsed.data.sessionId)
    .eq("learner_id", parsed.data.learnerId)
    .maybeSingle()
  if (existingError) throw new Error("Could not check the existing placement")
  if (existing && ["offered", "confirmed"].includes(existing.status)) {
    throw new Error("Use the placement action below; an offered or confirmed place cannot be overwritten")
  }
  const { error } = await supabase.from("session_placements").upsert({ session_id: parsed.data.sessionId, learner_id: parsed.data.learnerId, status: parsed.data.status, fit_note: parsed.data.fitNote || null, created_by: user.id }, { onConflict: "session_id,learner_id" })
  if (error) throw new Error("Could not save placement")
  revalidatePath("/admin/sessions")
  revalidatePath(`/admin/learners/${parsed.data.learnerId}`)
  revalidatePath("/admin/operations")
}

export async function sendSessionOffer(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = placementActionSchema.safeParse({ placementId: formData.get("placementId") })
  if (!parsed.success) throw new Error("Invalid placement")

  const { error } = await supabaseService().rpc("send_session_offer", {
    p_placement_id: parsed.data.placementId,
    p_actor_id: user.id,
  })
  if (error) throw new Error(error.message || "Could not send the session offer")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/sessions")
  revalidatePath("/admin/operations")
}

export async function acceptSessionOffer(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = placementActionSchema.safeParse({ placementId: formData.get("placementId") })
  if (!parsed.success) throw new Error("Invalid placement")

  const { error } = await supabaseService().rpc("accept_session_offer", {
    p_placement_id: parsed.data.placementId,
    p_actor_id: user.id,
  })
  if (error) throw new Error(error.message || "Could not confirm the session offer")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/sessions")
  revalidatePath("/admin/learners")
  revalidatePath("/admin/operations")
}

export async function saveLeadSessionOffer(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = leadOfferSchema.safeParse({
    sessionId: formData.get("sessionId"), parentLeadId: formData.get("parentLeadId"),
    learnerFirstName: formData.get("learnerFirstName"), learnerYearGroup: formData.get("learnerYearGroup") || undefined,
    seatNumber: formData.get("seatNumber") || undefined, fitNote: formData.get("fitNote") || undefined,
  })
  if (!parsed.success) throw new Error("Please check the offer details")
  const { error } = await supabaseService().from("session_offers").upsert({
    session_id: parsed.data.sessionId, parent_lead_id: parsed.data.parentLeadId,
    learner_first_name: parsed.data.learnerFirstName, learner_year_group: parsed.data.learnerYearGroup || null,
    seat_number: parsed.data.seatNumber || null, fit_note: parsed.data.fitNote || null, created_by: user.id,
  }, { onConflict: "session_id,parent_lead_id" })
  if (error) throw new Error("Could not save the session offer")
  revalidatePath("/admin/sessions"); revalidatePath("/admin/leads")
}

export async function sendLeadSessionOffer(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = offerActionSchema.safeParse({ offerId: formData.get("offerId") })
  if (!parsed.success) throw new Error("Invalid offer")
  const { error } = await supabaseService().rpc("send_lead_session_offer", { p_offer_id: parsed.data.offerId, p_actor_id: user.id })
  if (error) throw new Error(error.message || "Could not send the offer")
  revalidatePath("/admin/sessions"); revalidatePath("/admin/leads")
}

export async function acceptLeadSessionOffer(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = offerActionSchema.safeParse({ offerId: formData.get("offerId") })
  if (!parsed.success) throw new Error("Invalid offer")
  const { error } = await supabaseService().rpc("accept_lead_session_offer", { p_offer_id: parsed.data.offerId, p_actor_id: user.id })
  if (error) throw new Error(error.message || "Could not confirm acceptance")
  revalidatePath("/admin/sessions"); revalidatePath("/admin/leads"); revalidatePath("/admin/learners"); revalidatePath("/admin/operations")
}

export async function createTutorRoomBooking(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = tutorBookingSchema.safeParse({ learnerId: formData.get("learnerId") || undefined, parentLeadId: formData.get("parentLeadId") || undefined, teacherName: formData.get("teacherName"), startsAt: formData.get("startsAt"), endsAt: formData.get("endsAt"), note: formData.get("note") || undefined })
  if (!parsed.success) throw new Error("Please check the Tutor Room booking")
  const { error } = await supabaseService().from("tutor_room_bookings").insert({ learner_id: parsed.data.learnerId || null, parent_lead_id: parsed.data.parentLeadId || null, teacher_name: parsed.data.teacherName, starts_at: parsed.data.startsAt, ends_at: parsed.data.endsAt, note: parsed.data.note || null, created_by: user.id })
  if (error) throw new Error(error.code === "23P01" ? "The Tutor Room is already booked at that time" : "Could not save Tutor Room booking")
  revalidatePath("/admin/sessions")
}


export async function saveSessionDateOverride(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = sessionOverrideSchema.safeParse({
    sessionId: formData.get("sessionId"),
    serviceDate: formData.get("serviceDate"),
    teacherName: formData.get("teacherName") || undefined,
    focus: formData.get("focus") || undefined,
    startsAt: formData.get("startsAt") || undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
  })
  if (!parsed.success) throw new Error("Please check the daily table details")

  const { error } = await supabaseService().from("session_date_overrides").upsert({
    session_id: parsed.data.sessionId,
    service_date: parsed.data.serviceDate,
    teacher_name: parsed.data.teacherName || null,
    focus: parsed.data.focus || null,
    starts_at: parsed.data.startsAt || null,
    duration_minutes: parsed.data.durationMinutes || null,
    updated_by: user.id,
  }, { onConflict: "session_id,service_date" })
  if (error) throw new Error("Could not save the daily timetable change")
  revalidatePath("/admin/sessions")
}

export async function restoreSessionWeeklyDefault(formData: FormData) {
  await requireAdmin()
  const parsed = removeSessionOverrideSchema.safeParse({
    sessionId: formData.get("sessionId"),
    serviceDate: formData.get("serviceDate"),
  })
  if (!parsed.success) throw new Error("Invalid timetable change")

  const { error } = await supabaseService().from("session_date_overrides")
    .delete()
    .eq("session_id", parsed.data.sessionId)
    .eq("service_date", parsed.data.serviceDate)
  if (error) throw new Error("Could not restore the weekly timetable")
  revalidatePath("/admin/sessions")
}
