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
  deliverySessionId: z.string().uuid().optional(),
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
  childLeadId: z.string().uuid(),
  seatNumber: z.coerce.number().int().min(1).max(6),
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

const monthlyPlanSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  weekday: z.coerce.number().int().min(0).max(6),
  tableNumber: z.coerce.number().int().min(1).max(2),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  teacherName: z.string().trim().min(1).max(160),
  focus: z.string().trim().min(1).max(500),
})

const dailyDeliverySchema = z.object({
  serviceDate: z.string().date(),
  tableNumber: z.coerce.number().int().min(1).max(2),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  teacherName: z.string().trim().min(1).max(160),
  focus: z.string().trim().min(1).max(500),
})

const updateDeliverySessionSchema = dailyDeliverySchema.extend({ deliverySessionId: z.string().uuid() })

const deliverySeatSchema = z.object({
  deliverySessionId: z.string().uuid(),
  learnerId: z.string().uuid(),
  seatNumber: z.coerce.number().int().min(1).max(6),
})

const deliverySeatActionSchema = z.object({ deliverySeatId: z.string().uuid() })
const deliverySessionActionSchema = z.object({ deliverySessionId: z.string().uuid() })

const weeklyDeliveryChangeSchema = z.object({
  weekStart: z.string().date(),
  tableNumber: z.coerce.number().int().min(1).max(2),
  teacherName: z.string().trim().max(160).optional(),
  focus: z.string().trim().max(500).optional(),
  learnerId: z.string().uuid().optional(),
  learnerAction: z.enum(["none", "add", "remove"]),
  seatNumber: z.coerce.number().int().min(1).max(6).optional(),
}).superRefine((value, ctx) => {
  if (value.learnerAction === "add" && !value.seatNumber) ctx.addIssue({ code: "custom", message: "Choose a seat for the new learner" })
  if (value.learnerAction !== "none" && !value.learnerId) ctx.addIssue({ code: "custom", message: "Choose a learner" })
})

const paymentEntitlementSchema = z.object({
  parentLeadId: z.string().uuid(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  sessionsPerWeek: z.coerce.number().int().min(1).max(7),
  amountCents: z.coerce.number().int().min(0).optional(),
  note: z.string().trim().max(500).optional(),
})

const standingPlacementSchema = z.object({
  learnerId: z.string().uuid(),
  weekday: z.coerce.number().int().min(0).max(6),
  tableNumber: z.coerce.number().int().min(1).max(2),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  teacherName: z.string().trim().min(1).max(160),
  focus: z.string().trim().min(1).max(500),
  effectiveFrom: z.string().date(),
})

const generatePaidMonthSchema = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) })

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
    deliverySessionId: formData.get("deliverySessionId") || undefined,
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
      delivery_session_id: parsed.data.deliverySessionId || null,
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
    childLeadId: formData.get("childLeadId"), seatNumber: formData.get("seatNumber"), fitNote: formData.get("fitNote") || undefined,
  })
  if (!parsed.success) throw new Error("Please choose the parent, child and intended seat")
  const supabase = supabaseService()
  const { data: child, error: childError } = await supabase
    .from("child_leads")
    .select("parent_lead_id, first_name, school_year")
    .eq("id", parsed.data.childLeadId)
    .single()
  if (childError || !child || child.parent_lead_id !== parsed.data.parentLeadId) {
    throw new Error("That child does not belong to the selected parent lead")
  }

  const { error } = await supabase.from("session_offers").upsert({
    session_id: parsed.data.sessionId, parent_lead_id: parsed.data.parentLeadId,
    learner_first_name: child.first_name, learner_year_group: child.school_year || null,
    seat_number: parsed.data.seatNumber, fit_note: parsed.data.fitNote || null, created_by: user.id,
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


function datesInMonthForWeekday(month: string, weekday: number) {
  const [year, monthNumber] = month.split("-").map(Number)
  const cursor = new Date(Date.UTC(year, monthNumber - 1, 1))
  const result: string[] = []
  while (cursor.getUTCMonth() === monthNumber - 1) {
    if (cursor.getUTCDay() === weekday) result.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return result
}

export async function createMonthlyDeliveryPlan(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = monthlyPlanSchema.safeParse({
    month: formData.get("month"), weekday: formData.get("weekday"), tableNumber: formData.get("tableNumber"),
    startsAt: formData.get("startsAt"), durationMinutes: formData.get("durationMinutes"),
    teacherName: formData.get("teacherName"), focus: formData.get("focus"),
  })
  if (!parsed.success) throw new Error("Please complete the monthly table plan")
  const plan = parsed.data
  const supabase = supabaseService()
  const { data: planRow, error: planError } = await supabase.from("monthly_delivery_plans").insert({
    month_start: `${plan.month}-01`, weekday: plan.weekday, table_number: plan.tableNumber,
    starts_at: plan.startsAt, duration_minutes: plan.durationMinutes, teacher_name: plan.teacherName,
    focus: plan.focus, created_by: user.id,
  }).select("id").single()
  if (planError || !planRow) throw new Error("That monthly table plan already exists. Edit the dated plan instead.")

  const dates = datesInMonthForWeekday(plan.month, plan.weekday)
  const sessions = dates.map((serviceDate) => ({
    monthly_plan_id: planRow.id, service_date: serviceDate, table_number: plan.tableNumber,
    starts_at: plan.startsAt, duration_minutes: plan.durationMinutes, teacher_name: plan.teacherName,
    focus: plan.focus, created_by: user.id, updated_by: user.id,
  }))
  const { data: deliverySessions, error: sessionError } = await supabase.from("delivery_sessions").insert(sessions).select("id")
  if (sessionError || !deliverySessions) {
    await supabase.from("monthly_delivery_plans").delete().eq("id", planRow.id)
    throw new Error("Could not create the dated table plans")
  }

  const learnerIds = formData.getAll("learnerId").map((value) => String(value)).filter(Boolean)
  if (learnerIds.length) {
    const seats = deliverySessions.flatMap((deliverySession) => learnerIds.map((learnerId, index) => ({
      delivery_session_id: deliverySession.id, learner_id: learnerId, seat_number: index + 1, status: "scheduled", updated_by: user.id,
    })))
    const { error: seatError } = await supabase.from("delivery_seats").insert(seats)
    if (seatError) throw new Error("The monthly plan was created, but its learner seats could not be added")
  }
  revalidatePath("/admin/sessions")
}

export async function createDailyDeliverySession(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = dailyDeliverySchema.safeParse({
    serviceDate: formData.get("serviceDate"), tableNumber: formData.get("tableNumber"),
    startsAt: formData.get("startsAt"), durationMinutes: formData.get("durationMinutes"),
    teacherName: formData.get("teacherName"), focus: formData.get("focus"),
  })
  if (!parsed.success) throw new Error("Please complete this table's daily plan")
  const { error } = await supabaseService().from("delivery_sessions").insert({
    service_date: parsed.data.serviceDate, table_number: parsed.data.tableNumber,
    starts_at: parsed.data.startsAt, duration_minutes: parsed.data.durationMinutes,
    teacher_name: parsed.data.teacherName, focus: parsed.data.focus, created_by: user.id, updated_by: user.id,
  })
  if (error) throw new Error("This table is already planned for the selected date")
  revalidatePath("/admin/sessions")
}

export async function addDeliverySeat(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = deliverySeatSchema.safeParse({
    deliverySessionId: formData.get("deliverySessionId"), learnerId: formData.get("learnerId"), seatNumber: formData.get("seatNumber"),
  })
  if (!parsed.success) throw new Error("Choose a learner and an available seat")
  const { error } = await supabaseService().from("delivery_seats").insert({
    delivery_session_id: parsed.data.deliverySessionId, learner_id: parsed.data.learnerId,
    seat_number: parsed.data.seatNumber, status: "scheduled", updated_by: user.id,
  })
  if (error) throw new Error("That learner or seat is already on this table")
  revalidatePath("/admin/sessions")
}

export async function removeDeliverySeat(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = deliverySeatActionSchema.safeParse({ deliverySeatId: formData.get("deliverySeatId") })
  if (!parsed.success) throw new Error("Invalid seat")
  const { error } = await supabaseService().from("delivery_seats").update({ status: "not_attending", updated_by: user.id }).eq("id", parsed.data.deliverySeatId)
  if (error) throw new Error("Could not remove the learner from this date")
  revalidatePath("/admin/sessions")
}

export async function cancelDeliverySession(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = deliverySessionActionSchema.safeParse({ deliverySessionId: formData.get("deliverySessionId") })
  if (!parsed.success) throw new Error("Invalid table")
  const { error } = await supabaseService().from("delivery_sessions").update({ status: "cancelled", updated_by: user.id }).eq("id", parsed.data.deliverySessionId)
  if (error) throw new Error("Could not cancel this table")
  revalidatePath("/admin/sessions")
}


export async function updateDailyDeliverySession(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = updateDeliverySessionSchema.safeParse({
    deliverySessionId: formData.get("deliverySessionId"), serviceDate: formData.get("serviceDate"),
    tableNumber: formData.get("tableNumber"), startsAt: formData.get("startsAt"),
    durationMinutes: formData.get("durationMinutes"), teacherName: formData.get("teacherName"), focus: formData.get("focus"),
  })
  if (!parsed.success) throw new Error("Please check the daily table plan")
  const { error } = await supabaseService().from("delivery_sessions").update({
    starts_at: parsed.data.startsAt, duration_minutes: parsed.data.durationMinutes,
    teacher_name: parsed.data.teacherName, focus: parsed.data.focus, updated_by: user.id,
  }).eq("id", parsed.data.deliverySessionId)
  if (error) throw new Error("Could not save this date's table plan")
  revalidatePath("/admin/sessions")
}


export async function restoreDeliverySession(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = deliverySessionActionSchema.safeParse({ deliverySessionId: formData.get("deliverySessionId") })
  if (!parsed.success) throw new Error("Invalid table")
  const { error } = await supabaseService().from("delivery_sessions").update({ status: "scheduled", cancellation_note: null, updated_by: user.id }).eq("id", parsed.data.deliverySessionId)
  if (error) throw new Error("Could not restore this table")
  revalidatePath("/admin/sessions")
}


export async function applyWeeklyDeliveryChange(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = weeklyDeliveryChangeSchema.safeParse({
    weekStart: formData.get("weekStart"), tableNumber: formData.get("tableNumber"),
    teacherName: formData.get("teacherName") || undefined, focus: formData.get("focus") || undefined,
    learnerId: formData.get("learnerId") || undefined, learnerAction: formData.get("learnerAction") || "none",
    seatNumber: formData.get("seatNumber") || undefined,
  })
  if (!parsed.success) throw new Error("Please check the weekly change")
  const change = parsed.data
  if (!change.teacherName && !change.focus && change.learnerAction === "none") throw new Error("Choose a teacher, session type or learner change")

  const endDate = new Date(`${change.weekStart}T12:00:00`)
  endDate.setDate(endDate.getDate() + 6)
  const end = endDate.toISOString().slice(0, 10)
  const supabase = supabaseService()
  const { data: sessions, error: sessionError } = await supabase.from("delivery_sessions")
    .select("id").eq("table_number", change.tableNumber).eq("status", "scheduled")
    .gte("service_date", change.weekStart).lte("service_date", end)
  if (sessionError) throw new Error("Could not find that week's table plans")
  if (!sessions?.length) throw new Error("There are no planned sessions for that table in this week")

  if (change.teacherName || change.focus) {
    const updates: { teacher_name?: string; focus?: string; updated_by: string } = { updated_by: user.id }
    if (change.teacherName) updates.teacher_name = change.teacherName
    if (change.focus) updates.focus = change.focus
    const { error } = await supabase.from("delivery_sessions").update(updates).in("id", sessions.map((session) => session.id))
    if (error) throw new Error("Could not apply the weekly table change")
  }

  if (change.learnerAction === "remove" && change.learnerId) {
    const { error } = await supabase.from("delivery_seats").update({ status: "not_attending", updated_by: user.id })
      .in("delivery_session_id", sessions.map((session) => session.id)).eq("learner_id", change.learnerId).eq("status", "scheduled")
    if (error) throw new Error("Could not remove the learner for this week")
  }

  if (change.learnerAction === "add" && change.learnerId && change.seatNumber) {
    const sessionIds = sessions.map((session) => session.id)
    const { data: occupied, error: occupiedError } = await supabase.from("delivery_seats")
      .select("delivery_session_id, learner_id, seat_number")
      .in("delivery_session_id", sessionIds)
      .eq("status", "scheduled")
    if (occupiedError) throw new Error("Could not check the weekly seats")
    if (occupied?.some((seat) => seat.seat_number === change.seatNumber || seat.learner_id === change.learnerId)) {
      throw new Error("That learner or seat is already occupied on at least one day in the chosen week")
    }
    const { error } = await supabase.from("delivery_seats").insert(sessionIds.map((deliverySessionId) => ({
      delivery_session_id: deliverySessionId, learner_id: change.learnerId, seat_number: change.seatNumber,
      status: "scheduled", updated_by: user.id,
    })))
    if (error) throw new Error("Could not add the learner for this week")
  }
  revalidatePath("/admin/sessions")
}


export async function recordPaymentEntitlement(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = paymentEntitlementSchema.safeParse({
    parentLeadId: formData.get("parentLeadId"), periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"), sessionsPerWeek: formData.get("sessionsPerWeek"),
    amountCents: formData.get("amountCents") || undefined, note: formData.get("note") || undefined,
  })
  if (!parsed.success) throw new Error("Please check the payment period")
  const { error } = await supabaseService().from("payment_entitlements").upsert({
    parent_lead_id: parsed.data.parentLeadId, period_start: parsed.data.periodStart, period_end: parsed.data.periodEnd,
    sessions_per_week: parsed.data.sessionsPerWeek, status: "paid", amount_cents: parsed.data.amountCents || null,
    recorded_by: user.id, note: parsed.data.note || null,
  }, { onConflict: "parent_lead_id,period_start,period_end" })
  if (error) throw new Error("Could not record the payment period")
  revalidatePath("/admin/sessions")
}

export async function saveStandingPlacement(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = standingPlacementSchema.safeParse({
    learnerId: formData.get("learnerId"), weekday: formData.get("weekday"), tableNumber: formData.get("tableNumber"),
    startsAt: formData.get("startsAt"), durationMinutes: formData.get("durationMinutes"),
    teacherName: formData.get("teacherName"), focus: formData.get("focus"), effectiveFrom: formData.get("effectiveFrom"),
  })
  if (!parsed.success) throw new Error("Please complete the standing timetable place")
  const { error } = await supabaseService().from("standing_placements").insert({
    learner_id: parsed.data.learnerId, weekday: parsed.data.weekday, table_number: parsed.data.tableNumber,
    starts_at: parsed.data.startsAt, duration_minutes: parsed.data.durationMinutes, teacher_name: parsed.data.teacherName,
    focus: parsed.data.focus, effective_from: parsed.data.effectiveFrom, created_by: user.id, updated_by: user.id,
  })
  if (error) throw new Error("Could not save the standing timetable place")
  revalidatePath("/admin/sessions")
}


export async function generatePaidMonth(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = generatePaidMonthSchema.safeParse({ month: formData.get("month") })
  if (!parsed.success) throw new Error("Choose a month to generate")
  const month = parsed.data.month
  const [year, monthNumber] = month.split("-").map(Number)
  const start = `${month}-01`
  const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10)
  const supabase = supabaseService()
  const [{ data: placements, error: placementError }, { data: learners, error: learnerError }, { data: entitlements, error: paymentError }] = await Promise.all([
    supabase.from("standing_placements").select("id, learner_id, weekday, table_number, starts_at, duration_minutes, teacher_name, focus, effective_from, effective_to").eq("status", "active"),
    supabase.from("learners").select("id, parent_lead_id").eq("status", "active"),
    supabase.from("payment_entitlements").select("parent_lead_id, period_start, period_end").eq("status", "paid").lte("period_start", end).gte("period_end", start),
  ])
  if (placementError || learnerError || paymentError) throw new Error("Could not load the paid timetable")
  const parentByLearner = new Map((learners || []).map((learner) => [learner.id, learner.parent_lead_id]))
  const paidParents = new Set((entitlements || []).map((entitlement) => entitlement.parent_lead_id))
  const eligible = (placements || []).filter((placement) => {
    const parentLeadId = parentByLearner.get(placement.learner_id)
    return parentLeadId && paidParents.has(parentLeadId) &&
      placement.effective_from <= end && (!placement.effective_to || placement.effective_to >= start)
  })

  for (const placement of eligible) {
    for (const serviceDate of datesInMonthForWeekday(month, placement.weekday)) {
      const { data: session, error: existingError } = await supabase.from("delivery_sessions")
        .select("id, teacher_name, focus, starts_at, duration_minutes")
        .eq("service_date", serviceDate).eq("table_number", placement.table_number).maybeSingle()
      if (existingError) throw new Error("Could not check generated dates")
      let sessionId = session?.id
      if (!sessionId) {
        const { data: created, error: createError } = await supabase.from("delivery_sessions").insert({
          service_date: serviceDate, table_number: placement.table_number, starts_at: placement.starts_at,
          duration_minutes: placement.duration_minutes, teacher_name: placement.teacher_name, focus: placement.focus,
          created_by: user.id, updated_by: user.id,
        }).select("id").single()
        if (createError || !created) throw new Error("Could not create a paid delivery date")
        sessionId = created.id
      }
      const { data: seat } = await supabase.from("delivery_seats").select("id")
        .eq("delivery_session_id", sessionId).eq("learner_id", placement.learner_id).eq("status", "scheduled").maybeSingle()
      if (!seat) {
        const { count } = await supabase.from("delivery_seats").select("id", { count: "exact", head: true })
          .eq("delivery_session_id", sessionId).eq("status", "scheduled")
        if ((count || 0) >= 6) throw new Error("A paid table would exceed six seats")
        const { error: seatError } = await supabase.from("delivery_seats").insert({
          delivery_session_id: sessionId, learner_id: placement.learner_id, seat_number: (count || 0) + 1,
          status: "scheduled", updated_by: user.id,
        })
        if (seatError) throw new Error("Could not reserve a paid learner seat")
      }
    }
  }
  revalidatePath("/admin/sessions")
}


export async function saveWeeklyTableTemplate(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = z.object({
    weekday: z.coerce.number().int().min(0).max(6),
    tableNumber: z.coerce.number().int().min(1).max(2),
    startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    durationMinutes: z.coerce.number().int().min(15).max(360),
    teacherName: z.string().trim().max(160).optional(),
    focus: z.string().trim().min(1).max(500),
    effectiveFrom: z.string().date(),
  }).safeParse({
    weekday: formData.get("weekday"), tableNumber: formData.get("tableNumber"),
    startsAt: formData.get("startsAt"), durationMinutes: formData.get("durationMinutes"),
    teacherName: formData.get("teacherName") || undefined, focus: formData.get("focus"),
    effectiveFrom: formData.get("effectiveFrom"),
  })
  if (!parsed.success) throw new Error("Please complete the weekly table details")
  const supabase = supabaseService()
  const { error: closeError } = await supabase.from("weekly_table_templates")
    .update({ status: "paused", updated_by: user.id })
    .eq("weekday", parsed.data.weekday).eq("table_number", parsed.data.tableNumber).eq("status", "active")
  if (closeError) throw new Error("Could not update the weekly table plan")
  const { error } = await supabase.from("weekly_table_templates").insert({
    weekday: parsed.data.weekday, table_number: parsed.data.tableNumber,
    starts_at: parsed.data.startsAt, duration_minutes: parsed.data.durationMinutes,
    teacher_name: parsed.data.teacherName || null, focus: parsed.data.focus,
    effective_from: parsed.data.effectiveFrom, created_by: user.id, updated_by: user.id,
  })
  if (error) throw new Error("Could not save the weekly table plan")
  revalidatePath("/admin/sessions")
}

export async function openWeeklyTableForDate(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = z.object({
    serviceDate: z.string().date(),
    tableNumber: z.coerce.number().int().min(1).max(2),
  }).safeParse({ serviceDate: formData.get("serviceDate"), tableNumber: formData.get("tableNumber") })
  if (!parsed.success) throw new Error("Invalid table date")
  const day = new Date(`${parsed.data.serviceDate}T12:00:00`).getDay()
  const supabase = supabaseService()
  const { data: existing, error: existingError } = await supabase.from("delivery_sessions")
    .select("id").eq("service_date", parsed.data.serviceDate).eq("table_number", parsed.data.tableNumber).maybeSingle()
  if (existingError) throw new Error("Could not check this table")
  let sessionId = existing?.id
  if (!sessionId) {
    const { data: template, error: templateError } = await supabase.from("weekly_table_templates")
      .select("starts_at, duration_minutes, teacher_name, focus")
      .eq("weekday", day).eq("table_number", parsed.data.tableNumber).eq("status", "active")
      .lte("effective_from", parsed.data.serviceDate)
      .or(`effective_to.is.null,effective_to.gte.${parsed.data.serviceDate}`)
      .order("effective_from", { ascending: false }).limit(1).maybeSingle()
    if (templateError) throw new Error("Could not load the weekly table plan")
    if (!template) throw new Error("Set up the weekly table first")
    const { data: created, error: createError } = await supabase.from("delivery_sessions").insert({
      service_date: parsed.data.serviceDate, table_number: parsed.data.tableNumber,
      starts_at: template.starts_at, duration_minutes: template.duration_minutes,
      teacher_name: template.teacher_name, focus: template.focus,
      created_by: user.id, updated_by: user.id,
    }).select("id").single()
    if (createError || !created) throw new Error("Could not open this table for the selected date")
    sessionId = created.id
  }
  const [{ data: placements, error: placementError }, { data: paid, error: paidError }] = await Promise.all([
    supabase.from("standing_placements").select("learner_id, seat_number")
      .eq("weekday", day).eq("table_number", parsed.data.tableNumber).eq("status", "active")
      .lte("effective_from", parsed.data.serviceDate)
      .or(`effective_to.is.null,effective_to.gte.${parsed.data.serviceDate}`),
    supabase.from("child_payment_entitlements").select("learner_id")
      .eq("status", "paid").lte("period_start", parsed.data.serviceDate).gte("period_end", parsed.data.serviceDate),
  ])
  if (placementError || paidError) throw new Error("Could not load paid standing places")
  const paidIds = new Set((paid || []).map((item) => item.learner_id))
  for (const placement of placements || []) {
    if (!placement.seat_number || !paidIds.has(placement.learner_id)) continue
    const { data: occupied } = await supabase.from("delivery_seats").select("id, learner_id")
      .eq("delivery_session_id", sessionId).eq("seat_number", placement.seat_number).eq("status", "scheduled").maybeSingle()
    if (!occupied) {
      const { error } = await supabase.from("delivery_seats").insert({
        delivery_session_id: sessionId, learner_id: placement.learner_id, seat_number: placement.seat_number,
        status: "scheduled", updated_by: user.id,
      })
      if (error) throw new Error("Could not reserve a paid standing seat")
    }
  }
  revalidatePath("/admin/sessions")
}
