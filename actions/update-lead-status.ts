"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import { supabaseService } from "@/lib/supabase/service"
import { sendPaymentConfirmedInvitation } from "@/lib/parent-invitations"

const leadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum([
    "new",
    "warm",
    "priority",
    "contacted",
    "offer_sent",
    "waitlist",
    "closed",
  ]),
})

const deleteLeadSchema = z.object({
  leadId: z.string().uuid(),
  confirmation: z.literal("DELETE"),
})

const paidFamilyEnrolmentSchema = z.object({
  parentLeadId: z.string().uuid(),
  childLeadIds: z.array(z.string().uuid()).min(1),
})

const manualLeadSchema = z.object({
  parentName: z.string().trim().min(2).max(160), email: z.string().trim().email().max(254), phone: z.string().trim().max(50).optional(),
  childFirstName: z.string().trim().min(1).max(80), childAge: z.coerce.number().int().min(4).max(18), schoolYear: z.string().trim().max(80).optional(),
  source: z.string().trim().min(2).max(80),
})

export async function updateLeadStatus(formData: FormData) {
  await requireAdmin()

  const parsed = leadStatusSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    throw new Error("Invalid lead status update")
  }

  const supabase = supabaseService()
  const { error } = await supabase
    .from("parent_leads")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.leadId)

  if (error) {
    console.error("Lead status update failed:", error)
    throw new Error("Could not update lead status")
  }

  revalidatePath("/admin")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/trends")
}

export async function deleteLead(formData: FormData) {
  await requireAdmin()

  const parsed = deleteLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    confirmation: formData.get("confirmation"),
  })

  if (!parsed.success) {
    throw new Error("Deletion was not confirmed")
  }

  const supabase = supabaseService()
  const { error } = await supabase
    .from("parent_leads")
    .delete()
    .eq("id", parsed.data.leadId)

  if (error) {
    console.error("Lead deletion failed:", error)
    throw new Error("Could not delete lead")
  }

  revalidatePath("/admin")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/trends")
}

export async function createManualLead(formData: FormData) {
  await requireAdmin()
  const parsed = manualLeadSchema.safeParse({ parentName: formData.get("parentName"), email: formData.get("email"), phone: formData.get("phone") || undefined, childFirstName: formData.get("childFirstName"), childAge: formData.get("childAge"), schoolYear: formData.get("schoolYear") || undefined, source: formData.get("source") })
  if (!parsed.success) throw new Error("Please check the lead details")
  const data = parsed.data; const supabase = supabaseService()
  const { data: lead, error: leadError } = await supabase.from("parent_leads").insert({ parent_name: data.parentName, email: data.email, phone: data.phone || null, interest_level: "interested_timetable", consent_contact: true, source: data.source, status: "new" }).select("id").single()
  if (leadError || !lead) throw new Error("Could not create parent lead")
  const { data: child, error: childError } = await supabase.from("child_leads").insert({ parent_lead_id: lead.id, first_name: data.childFirstName, child_age: data.childAge, school_year: data.schoolYear || null, curriculum: "other_not_sure", support_needs: [] }).select("id").single()
  if (childError || !child) throw new Error("Could not create child lead")
  const { error: timetableError } = await supabase.from("timetable_preferences").insert({ child_lead_id: child.id, preferred_days: [], preferred_times: [] })
  if (timetableError) throw new Error("Could not create timetable preference")
  revalidatePath("/admin/leads"); revalidatePath("/admin"); revalidatePath("/admin/sessions")
}


export async function enrolPaidChildren(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = paidFamilyEnrolmentSchema.safeParse({
    parentLeadId: formData.get("parentLeadId"),
    childLeadIds: formData.getAll("childLeadId"),
  })
  if (!parsed.success) throw new Error("Select at least one child to enrol")

  const { error } = await supabaseService().rpc("enrol_paid_children", {
    p_parent_lead_id: parsed.data.parentLeadId,
    p_child_lead_ids: parsed.data.childLeadIds,
    p_actor_id: user.id,
  })
  if (error) throw new Error(error.message || "Could not enrol the selected children")

  revalidatePath("/admin")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/learners")
  revalidatePath("/admin/sessions")
  revalidatePath("/admin/operations")
}


export async function acceptBookedPlace(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = z.object({
    parentLeadId: z.string().uuid(), childLeadId: z.string().uuid(), templateId: z.string().uuid(),
    seatNumber: z.coerce.number().int().min(1).max(6),
  }).safeParse({
    parentLeadId: formData.get("parentLeadId"), childLeadId: formData.get("childLeadId"),
    templateId: formData.get("templateId"), seatNumber: formData.get("seatNumber"),
  })
  if (!parsed.success) throw new Error("Choose a bookable timetable slot and seat")
  const data = parsed.data
  const supabase = supabaseService()
  const [{ data: child, error: childError }, { data: template, error: templateError }] = await Promise.all([
    supabase.from("child_leads").select("parent_lead_id").eq("id", data.childLeadId).single(),
    supabase.from("weekly_table_templates").select("weekday, table_number, academy_table_id, starts_at, duration_minutes")
      .eq("id", data.templateId).eq("status", "active").maybeSingle(),
  ])
  if (childError || child?.parent_lead_id !== data.parentLeadId) throw new Error("That child does not belong to this parent")
  if (templateError || !template) throw new Error("That timetable slot is no longer available")
  const { data: table, error: tableError } = await supabase.from("academy_tables")
    .select("seat_capacity, status").eq("id", template.academy_table_id).maybeSingle()
  if (tableError || !table || table.status !== "active") throw new Error("That Academy table is no longer available")
  if (data.seatNumber > table.seat_capacity) throw new Error("Choose a seat within this table’s configured capacity")
  const { data: occupied, error: occupiedError } = await supabase.from("accepted_bookings").select("id")
    .eq("weekday", template.weekday).eq("academy_table_id", template.academy_table_id)
    .eq("starts_at", template.starts_at).eq("seat_number", data.seatNumber)
    .in("status", ["accepted_awaiting_payment", "paid_active"]).maybeSingle()
  if (occupiedError) throw new Error("Could not check the seat")
  if (occupied) throw new Error("That recurring seat is already held")
  const { error: bookingError } = await supabase.from("accepted_bookings").insert({
    parent_lead_id: data.parentLeadId, child_lead_id: data.childLeadId,
    weekday: template.weekday, table_number: template.table_number, academy_table_id: template.academy_table_id, seat_number: data.seatNumber,
    starts_at: template.starts_at, duration_minutes: template.duration_minutes, accepted_by: user.id,
  })
  if (bookingError) throw new Error("Could not save the accepted place")
  const { error: leadError } = await supabase.from("parent_leads").update({ status: "accepted_awaiting_payment" }).eq("id", data.parentLeadId)
  if (leadError) throw new Error("Could not update the lead")
  revalidatePath("/admin/leads"); revalidatePath("/admin/sessions")
}

export async function activateAcceptedBookingsPayment(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = z.object({
    parentLeadId: z.string().uuid(), receivedOn: z.string().date(),
    periodStart: z.string().date(), periodEnd: z.string().date(),
  }).refine((value) => value.periodEnd >= value.periodStart, { message: "Service period is invalid" }).safeParse({
    parentLeadId: formData.get("parentLeadId"), receivedOn: formData.get("receivedOn"),
    periodStart: formData.get("periodStart"), periodEnd: formData.get("periodEnd"),
  })
  if (!parsed.success) throw new Error("Please check the payment dates")
  const data = parsed.data
  const supabase = supabaseService()
  const { data: bookings, error: bookingError } = await supabase.from("accepted_bookings")
    .select("id, child_lead_id, weekday, table_number, academy_table_id, seat_number, starts_at, duration_minutes")
    .eq("parent_lead_id", data.parentLeadId).eq("status", "accepted_awaiting_payment")
  if (bookingError || !bookings?.length) throw new Error("No accepted places are awaiting payment")
  const { data: payment, error: paymentError } = await supabase.from("payment_entitlements").upsert({
    parent_lead_id: data.parentLeadId, period_start: data.periodStart, period_end: data.periodEnd,
    sessions_per_week: 1, status: "paid", received_at: `${data.receivedOn}T12:00:00Z`, recorded_by: user.id,
  }, { onConflict: "parent_lead_id,period_start,period_end" }).select("id").single()
  if (paymentError || !payment) throw new Error("Could not record the family payment")
  for (const booking of bookings) {
    const { data: child, error: childError } = await supabase.from("child_leads").select("first_name, school_year")
      .eq("id", booking.child_lead_id).single()
    if (childError || !child?.first_name) throw new Error("Each accepted child needs a first name before activation")
    let { data: learner } = await supabase.from("learners").select("id").eq("child_lead_id", booking.child_lead_id).maybeSingle()
    if (!learner) {
      const { data: created, error: createError } = await supabase.from("learners").insert({
        parent_lead_id: data.parentLeadId, child_lead_id: booking.child_lead_id, first_name: child.first_name,
        year_group: child.school_year || null, status: "active", parent_information_confirmed: true,
      }).select("id").single()
      if (createError || !created) throw new Error("Could not create the learner record")
      learner = created
    } else {
      const { error } = await supabase.from("learners").update({ status: "active" }).eq("id", learner.id)
      if (error) throw new Error("Could not activate the learner")
    }
    const { error: entitlementError } = await supabase.from("child_payment_entitlements").upsert({
      payment_entitlement_id: payment.id, learner_id: learner.id, period_start: data.periodStart, period_end: data.periodEnd,
      sessions_per_week: 1, status: "paid", recorded_by: user.id,
    }, { onConflict: "learner_id,period_start,period_end" })
    if (entitlementError) throw new Error("Could not activate the child payment period")
    const { error: endError } = await supabase.from("standing_placements").update({ status: "ended", effective_to: data.periodStart, updated_by: user.id })
      .eq("learner_id", learner.id).eq("weekday", booking.weekday).eq("status", "active")
    if (endError) throw new Error("Could not update the previous standing place")
    const { error: placementError } = await supabase.from("standing_placements").insert({
      learner_id: learner.id, weekday: booking.weekday, table_number: booking.table_number, academy_table_id: booking.academy_table_id, seat_number: booking.seat_number,
      starts_at: booking.starts_at, duration_minutes: booking.duration_minutes, effective_from: data.periodStart,
      created_by: user.id, updated_by: user.id,
    })
    if (placementError) throw new Error("Could not activate the standing place")
    const { error: paidError } = await supabase.from("accepted_bookings").update({
      learner_id: learner.id, payment_entitlement_id: payment.id, status: "paid_active", paid_at: new Date().toISOString(), paid_by: user.id,
    }).eq("id", booking.id)
    if (paidError) throw new Error("Could not activate the accepted place")

    const cursor = new Date(`${data.periodStart}T12:00:00Z`)
    const end = new Date(`${data.periodEnd}T12:00:00Z`)
    while (cursor <= end) {
      if (cursor.getUTCDay() === booking.weekday) {
        const serviceDate = cursor.toISOString().slice(0, 10)
        const { data: session, error: sessionError } = await supabase.from("delivery_sessions")
          .upsert({ service_date: serviceDate, table_number: booking.table_number, academy_table_id: booking.academy_table_id,
            starts_at: booking.starts_at, duration_minutes: booking.duration_minutes, status: "scheduled", created_by: user.id, updated_by: user.id },
            { onConflict: "service_date,academy_table_id,starts_at", ignoreDuplicates: false })
          .select("id").single()
        if (sessionError || !session) throw new Error("Could not prepare the paid delivery session")
        const { error: seatError } = await supabase.from("delivery_seats").upsert({ delivery_session_id: session.id, learner_id: learner.id,
          seat_number: booking.seat_number, status: "scheduled", updated_by: user.id }, { onConflict: "delivery_session_id,learner_id", ignoreDuplicates: false })
        if (seatError) throw new Error("Could not prepare the paid learner seat")
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }
  const { error: leadError } = await supabase.from("parent_leads").update({
    status: "converted", enrolled_at: new Date().toISOString(), enrolled_by: user.id,
    payment_confirmed_at: new Date().toISOString(), payment_confirmed_by: user.id,
  }).eq("id", data.parentLeadId)
  if (leadError) throw new Error("Could not mark the family paid")
  await sendPaymentConfirmedInvitation({ parentLeadId: data.parentLeadId, actorId: user.id })
  revalidatePath("/admin"); revalidatePath("/admin/leads"); revalidatePath("/admin/learners"); revalidatePath("/admin/sessions")
}


export type AcceptedPlaceActionState = { error?: string; success?: string }

export async function submitAcceptedPlace(
  _previousState: AcceptedPlaceActionState,
  formData: FormData,
): Promise<AcceptedPlaceActionState> {
  try {
    await acceptBookedPlace(formData)
    return { success: "Place held — you can now record another child or payment." }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the place"
    if (message === "That recurring seat is already held") {
      return { error: "Choose another seat — this recurring seat is already held for another family." }
    }
    return { error: message }
  }
}
