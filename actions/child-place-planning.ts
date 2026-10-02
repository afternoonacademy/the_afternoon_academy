"use server"

import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import { resend, resendFromEmail } from "@/lib/email/resend"
import {
  paidPeriodSummary,
  sortPaidPeriodSessions,
  type PaidPeriodSession,
} from "@/lib/paid-period"
import { supabaseService } from "@/lib/supabase/service"

const plannedSessionSchema = z.object({
  learnerId: z.string().uuid().nullable(),
  learnerName: z.string().trim().min(1).max(80),
  childLeadId: z.string().uuid().nullable().optional(),
  placementId: z.string().min(1).max(100),
  date: z.string().date(),
  academyTableId: z.string().uuid(),
  tableNumber: z.coerce.number().int().min(1).max(40),
  seatNumber: z.coerce.number().int().min(1).max(40),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.coerce.number().int().min(15).max(360),
  teacherName: z.string().trim().max(160).nullable(),
  focus: z.string().trim().max(500).nullable(),
  pricePlanId: z.string().uuid(),
  pricePlanName: z.string().trim().min(1).max(160),
  priceCents: z.coerce.number().int().min(0),
  replacement: z.boolean(),
})

const plannedPlaceSchema = z.object({
  templateId: z.string().uuid(),
  seatNumber: z.coerce.number().int().min(1).max(40),
  pricePlanId: z.string().uuid(),
})

const planSchema = z.object({
  parentLeadId: z.string().uuid(),
  childLeadId: z.string().uuid(),
  plannedPlaces: z.string().min(2),
  selectedSessions: z.string().min(2),
})

const childActionSchema = z.object({
  parentLeadId: z.string().uuid(),
  childLeadId: z.string().uuid(),
})


const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const defaultPlannedPlaceSubject =
  "Planned Academy place for {{child_name}}"

const defaultPlannedPlaceBody =
  "Dear {{parent_name}},\n\nWe can offer {{child_name}} the following place at The Afternoon Academy:\n{{recurring_place}}\n{{price_plan_name}} · {{session_price}} per session\n\nPlanned service dates:\n{{service_dates}}\n\nThat is {{session_count}} session(s), totalling {{amount_due}}.\n\n{{payment_details}}\n\nPayment reference: {{payment_reference}}\n\nOnce the transfer has cleared, we will confirm the exact paid dates and activate the dated Operations places.\n\nWarmly,\nThe Afternoon Academy"

function applyTemplate(source: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll("{{" + key + "}}", value),
    source,
  )
}

function parseSessions(raw: string): PaidPeriodSession[] {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error("The planned service dates could not be read")
  }
  const parsed = z.array(plannedSessionSchema).min(1).safeParse(value)
  if (!parsed.success) throw new Error("Choose at least one planned service date")
  return sortPaidPeriodSessions(parsed.data)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value + "T12:00:00Z"))
}

function money(cents: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export async function recordPlannedChildPlace(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = planSchema.safeParse({
    parentLeadId: formData.get("parentLeadId"),
    childLeadId: formData.get("childLeadId"),
    plannedPlaces: formData.get("plannedPlaces"),
    selectedSessions: formData.get("selectedSessions"),
  })
  if (!parsed.success) {
    throw new Error("Choose at least one recurring table/time, seat, price plan and planned date")
  }

  let rawPlaces: unknown
  try {
    rawPlaces = JSON.parse(parsed.data.plannedPlaces)
  } catch {
    throw new Error("The planned recurring places could not be read")
  }
  const places = z.array(plannedPlaceSchema).min(1).max(7).parse(rawPlaces)
  const templateIds = [...new Set(places.map((place) => place.templateId))]
  if (templateIds.length !== places.length) {
    throw new Error("Each recurring table/time can only be selected once")
  }

  const submitted = parseSessions(parsed.data.selectedSessions)
  const supabase = supabaseService()

  const [
    { data: child, error: childError },
    { data: templates, error: templateError },
    { data: pricePlans, error: pricePlanError },
    { data: tables, error: tableError },
    { data: closures, error: closureError },
    { data: currentBookings, error: currentBookingError },
  ] = await Promise.all([
    supabase.from("child_leads").select("parent_lead_id,first_name,pipeline_status").eq("id", parsed.data.childLeadId).single(),
    supabase.from("weekly_table_templates").select("id,weekday,table_number,academy_table_id,starts_at,duration_minutes,teacher_name,focus,status").in("id", templateIds).eq("status", "active"),
    supabase.from("session_price_plans").select("id,name,price_cents,status").in("id", [...new Set(places.map((place) => place.pricePlanId))]).eq("status", "active"),
    supabase.from("academy_tables").select("id,seat_capacity,status").eq("status", "active"),
    supabase.from("academy_closures").select("starts_on,ends_on,reason"),
    supabase.from("accepted_bookings").select("id,weekly_table_template_id,status").eq("parent_lead_id", parsed.data.parentLeadId).eq("child_lead_id", parsed.data.childLeadId).in("status", ["session_planned", "contacted", "accepted_awaiting_payment"]),
  ])

  if (childError || !child || child.parent_lead_id !== parsed.data.parentLeadId) {
    throw new Error("That child does not belong to this family")
  }
  if (!child.first_name) throw new Error("Add the child’s first name before planning a place")
  if (templateError || pricePlanError || tableError || closureError || currentBookingError) {
    throw new Error("One or more selected recurring places could not be verified")
  }
  if ((templates || []).length !== templateIds.length) {
    throw new Error("One or more selected recurring places is no longer active")
  }

  const templateById = new Map((templates || []).map((item) => [item.id, item]))
  const planById = new Map((pricePlans || []).map((item) => [item.id, item]))
  const tableById = new Map((tables || []).map((item) => [item.id, item]))
  const currentByTemplate = new Map(
    (currentBookings || [])
      .filter((item) => Boolean(item.weekly_table_template_id))
      .map((item) => [item.weekly_table_template_id as string, item]),
  )

  const serverSessions: PaidPeriodSession[] = []

  for (const place of places) {
    const template = templateById.get(place.templateId)
    const pricePlan = planById.get(place.pricePlanId)
    const table = template ? tableById.get(template.academy_table_id) : null
    if (!template || !pricePlan || !table || place.seatNumber > table.seat_capacity) {
      throw new Error("Check the selected recurring place, seat and price plan")
    }

    const { data: occupied } = await supabase
      .from("accepted_bookings")
      .select("id")
      .eq("weekday", template.weekday)
      .eq("academy_table_id", template.academy_table_id)
      .eq("starts_at", template.starts_at)
      .eq("seat_number", place.seatNumber)
      .in("status", ["session_planned", "contacted", "accepted_awaiting_payment", "paid_active"])
      .neq("id", currentByTemplate.get(place.templateId)?.id || "00000000-0000-0000-0000-000000000000")
      .maybeSingle()

    if (occupied) {
      throw new Error(`Seat ${place.seatNumber} is already allocated for ${weekdayNames[template.weekday]} at ${template.starts_at.slice(0, 5)}`)
    }

    const { data: legacyOffer } = await supabase
      .from("place_offers")
      .select("id")
      .eq("weekday", template.weekday)
      .eq("academy_table_id", template.academy_table_id)
      .eq("starts_at", template.starts_at)
      .eq("seat_number", place.seatNumber)
      .in("status", ["draft", "sent", "viewed", "accepted"])
      .maybeSingle()
    if (legacyOffer) throw new Error(`Seat ${place.seatNumber} is held by an existing place offer`)

    const placeSessions = submitted.filter((session) => session.placementId === template.id)
    if (!placeSessions.length) {
      throw new Error(`Choose at least one planned date for ${weekdayNames[template.weekday]} at ${template.starts_at.slice(0, 5)}`)
    }

    for (const item of placeSessions) {
      if (
        item.academyTableId !== template.academy_table_id ||
        item.tableNumber !== template.table_number ||
        item.startsAt !== template.starts_at.slice(0, 5) ||
        item.seatNumber !== place.seatNumber ||
        item.pricePlanId !== pricePlan.id
      ) {
        throw new Error("The planned dates no longer match the recurring places")
      }
      const closure = (closures || []).find((row) => row.starts_on <= item.date && row.ends_on >= item.date)
      if (closure) throw new Error(formatDate(item.date) + " is closed: " + closure.reason)

      serverSessions.push({
        learnerId: null,
        learnerName: child.first_name,
        childLeadId: parsed.data.childLeadId,
        placementId: template.id,
        date: item.date,
        academyTableId: template.academy_table_id,
        tableNumber: template.table_number,
        seatNumber: place.seatNumber,
        startsAt: template.starts_at.slice(0, 5),
        durationMinutes: template.duration_minutes,
        teacherName: template.teacher_name,
        focus: template.focus,
        pricePlanId: pricePlan.id,
        pricePlanName: pricePlan.name,
        priceCents: pricePlan.price_cents,
        replacement: new Date(item.date + "T12:00:00Z").getUTCDay() !== template.weekday,
      })
    }
  }

  for (const place of places) {
    const template = templateById.get(place.templateId)!
    const pricePlan = planById.get(place.pricePlanId)!
    const placeSessions = serverSessions.filter((session) => session.placementId === place.templateId)
    const summary = paidPeriodSummary(placeSessions)
    const payload = {
      parent_lead_id: parsed.data.parentLeadId,
      child_lead_id: parsed.data.childLeadId,
      weekly_table_template_id: template.id,
      session_price_plan_id: pricePlan.id,
      weekday: template.weekday,
      table_number: template.table_number,
      academy_table_id: template.academy_table_id,
      seat_number: place.seatNumber,
      starts_at: template.starts_at,
      duration_minutes: template.duration_minutes,
      status: "session_planned",
      accepted_by: user.id,
      planned_sessions: placeSessions,
      planned_amount_cents: summary.amountCents,
      planned_period_start: summary.periodStart,
      planned_period_end: summary.periodEnd,
      contacted_at: null,
      contacted_by: null,
    }
    const existing = currentByTemplate.get(place.templateId)
    const result = existing
      ? await supabase.from("accepted_bookings").update(payload).eq("id", existing.id)
      : await supabase.from("accepted_bookings").insert(payload)
    if (result.error) {
      if (result.error.code === "23505") throw new Error("One of those recurring seats was taken. Review the seat map and try again.")
      console.error("Multi-place plan save failed", result.error)
      throw new Error("Could not record all planned places")
    }
  }

  const selectedTemplateIds = new Set(templateIds)
  const removedIds = (currentBookings || [])
    .filter((booking) => !booking.weekly_table_template_id || !selectedTemplateIds.has(booking.weekly_table_template_id))
    .map((booking) => booking.id)
  if (removedIds.length) {
    const { error } = await supabase.from("accepted_bookings").update({ status: "cancelled" }).in("id", removedIds)
    if (error) throw new Error("Could not release a removed recurring place")
  }

  const { error: statusError } = await supabase.from("child_leads").update({ pipeline_status: "session_planned" }).eq("id", parsed.data.childLeadId)
  if (statusError) throw new Error("The places were planned, but the child status could not be updated")

  revalidatePath("/admin")
  revalidatePath("/admin/leads")
}

export async function releasePlannedChildPlace(formData: FormData) {
  await requireAdmin()
  const parsed = childActionSchema.safeParse({
    parentLeadId: formData.get("parentLeadId"),
    childLeadId: formData.get("childLeadId"),
  })
  if (!parsed.success) throw new Error("Could not identify this child")

  const supabase = supabaseService()
  const { error } = await supabase
    .from("accepted_bookings")
    .update({ status: "cancelled" })
    .eq("parent_lead_id", parsed.data.parentLeadId)
    .eq("child_lead_id", parsed.data.childLeadId)
    .in("status", ["session_planned", "contacted", "accepted_awaiting_payment"])

  if (error) throw new Error("Could not release the planned place")

  await supabase
    .from("child_leads")
    .update({ pipeline_status: "new" })
    .eq("id", parsed.data.childLeadId)

  revalidatePath("/admin")
  revalidatePath("/admin/leads")
}


export async function sendPlannedPlaceEmail(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = childActionSchema.safeParse({
    parentLeadId: formData.get("parentLeadId"),
    childLeadId: formData.get("childLeadId"),
  })
  if (!parsed.success) throw new Error("Could not identify this child")
  if (!resend) throw new Error("Email sending is not configured")

  const supabase = supabaseService()
  const [
    { data: parent },
    { data: child },
    { data: bookings },
    { data: emailTemplate },
  ] = await Promise.all([
    supabase.from("parent_leads").select("parent_name,email").eq("id", parsed.data.parentLeadId).single(),
    supabase.from("child_leads").select("parent_lead_id,first_name").eq("id", parsed.data.childLeadId).single(),
    supabase
      .from("accepted_bookings")
      .select("id,status,weekday,table_number,seat_number,starts_at,planned_sessions,planned_amount_cents,session_price_plan_id,session_price_plans(name,price_cents)")
      .eq("parent_lead_id", parsed.data.parentLeadId)
      .eq("child_lead_id", parsed.data.childLeadId)
      .in("status", ["session_planned", "contacted"])
      .order("weekday")
      .order("starts_at"),
    supabase.from("academy_email_templates").select("subject_template,body_template").eq("template_key", "planned_place_offer").maybeSingle(),
  ])

  if (!parent || !child || child.parent_lead_id !== parsed.data.parentLeadId || !(bookings || []).length) {
    throw new Error("Plan the child’s recurring place before sending the parent email")
  }

  const sessions = sortPaidPeriodSessions(
    (bookings || []).flatMap((booking) =>
      parseSessions(JSON.stringify(booking.planned_sessions || [])),
    ),
  )
  const total = paidPeriodSummary(sessions).amountCents
  const recurringPlaces = (bookings || [])
    .map(
      (booking) =>
        weekdayNames[booking.weekday] +
        " · " +
        String(booking.starts_at).slice(0, 5) +
        " · Table " +
        booking.table_number,
    )
    .join("\n")

  const planNames = [
    ...new Set(
      (bookings || []).map((booking) => {
        const relation = Array.isArray(booking.session_price_plans)
          ? booking.session_price_plans[0]
          : booking.session_price_plans
        return relation?.name || "Academy session"
      }),
    ),
  ]
  const sessionPrices = [...new Set(sessions.map((session) => money(session.priceCents)))]
  const datesText = sessions
    .map(
      (session) =>
        formatDate(session.date) +
        " · " +
        session.startsAt +
        " · Table " +
        session.tableNumber +
        (session.replacement ? " · replacement" : ""),
    )
    .join("\n")

  const bankName = process.env.TAA_BANK_ACCOUNT_NAME || ""
  const iban = process.env.TAA_BANK_IBAN || ""
  const childName = child.first_name || "your child"
  const paymentReference = child.first_name || parent.parent_name
  const paymentDetails =
    bankName && iban
      ? "Payment details:\nAccount name: " + bankName + "\nIBAN: " + iban
      : "Please use the usual Academy bank-transfer details."

  const values: Record<string, string> = {
    parent_name: parent.parent_name,
    child_name: childName,
    recurring_place: recurringPlaces,
    price_plan_name: planNames.join(" / "),
    session_price: sessionPrices.length === 1 ? sessionPrices[0] : sessionPrices.join(" / "),
    service_dates: datesText,
    session_count: String(sessions.length),
    amount_due: money(total),
    payment_details: paymentDetails,
    payment_reference: paymentReference,
  }

  const subject = applyTemplate(emailTemplate?.subject_template || defaultPlannedPlaceSubject, values)
  const body = applyTemplate(emailTemplate?.body_template || defaultPlannedPlaceBody, values)
  const safeHtml = body.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

  const bookingIds = (bookings || []).map((booking) => booking.id)
  const idempotencyKey = "planned-place-" + bookingIds.sort().join("-") + "-" + randomBytes(4).toString("hex")

  const { data: deliveryLog } = await supabase
    .from("email_delivery_log")
    .insert({
      parent_lead_id: parsed.data.parentLeadId,
      email_kind: "planned_place",
      recipient_email: parent.email,
      idempotency_key: idempotencyKey,
      subject,
      body_text: body,
      created_by: user.id,
    })
    .select("id")
    .single()

  const { data: sendData, error: sendError } = await resend.emails.send(
    {
      from: resendFromEmail,
      to: [parent.email],
      subject,
      text: body,
      html: '<main style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:auto;white-space:pre-line">' + safeHtml + "</main>",
    },
    { headers: { "Idempotency-Key": idempotencyKey } },
  )

  if (sendError) {
    if (deliveryLog) {
      await supabase.from("email_delivery_log").update({ status: "failed", error_message: sendError.message.slice(0, 500) }).eq("id", deliveryLog.id)
    }
    throw new Error("The planned places are still saved, but the parent email could not be sent")
  }

  const now = new Date().toISOString()
  await Promise.all([
    supabase.from("accepted_bookings").update({ status: "contacted", contacted_at: now, contacted_by: user.id }).in("id", bookingIds),
    supabase.from("child_leads").update({ pipeline_status: "contacted" }).eq("id", parsed.data.childLeadId),
    supabase.from("parent_leads").update({ status: "contacted" }).eq("id", parsed.data.parentLeadId),
    deliveryLog
      ? supabase.from("email_delivery_log").update({ status: "sent", resend_email_id: sendData?.id || null, sent_at: now }).eq("id", deliveryLog.id)
      : Promise.resolve(),
  ])

  revalidatePath("/admin")
  revalidatePath("/admin/leads")
}
