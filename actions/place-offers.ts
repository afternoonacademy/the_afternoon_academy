"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createHash, randomBytes } from "node:crypto"

import { requireAdmin } from "@/lib/auth/require-admin"
import { getResend, emailFrom } from "@/lib/resend"
import { supabaseService } from "@/lib/supabase/service"

const offerSchema = z
  .object({
    parentLeadId: z.string().uuid(),
    childLeadId: z.string().uuid(),
    templateId: z.string().uuid(),
    seatNumber: z.coerce.number().int().min(1).max(40),
    amountEuros: z.coerce.number().positive().max(100000),
    periodStart: z.string().date(),
    periodEnd: z.string().date(),
    expiryHours: z.coerce.number().int().min(1).max(168).default(48),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    message: "The service period end date must follow the start date",
  })

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function formatEuros(amountCents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
    new Date(value + "T12:00:00Z"),
  )
}

function dayName(value: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][value]
}

function placeOfferEmail(input: {
  parentName: string
  childName: string
  weekday: number
  startsAt: string
  tableNumber: number
  periodStart: string
  periodEnd: string
  amountCents: number
  paymentReference: string
  expiresAt: Date
  offerUrl: string
}) {
  const bankName = process.env.TAA_BANK_ACCOUNT_NAME
  const bankIban = process.env.TAA_BANK_IBAN
  const bankBic = process.env.TAA_BANK_BIC

  if (!bankName || !bankIban) {
    throw new Error("TAA bank details are not configured")
  }

  const paymentDetails = [
    `Account name: ${bankName}`,
    `IBAN: ${bankIban}`,
    bankBic ? `BIC: ${bankBic}` : null,
    `Reference: ${input.paymentReference}`,
  ]
    .filter(Boolean)
    .map((item) => `<li>${item}</li>`)
    .join("")

  return {
    subject: `Your TAA place offer for ${input.childName}`,
    text: `Hello ${input.parentName}, we are pleased to offer ${input.childName} a place at The Afternoon Academy. ${dayName(input.weekday)} at ${input.startsAt.slice(0, 5)}, Table ${input.tableNumber}. Service period: ${formatDate(input.periodStart)} to ${formatDate(input.periodEnd)}. Total: ${formatEuros(input.amountCents)}. Transfer reference: ${input.paymentReference}. View your offer: ${input.offerUrl}`,
    html: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#20304a"><p>Hello ${input.parentName},</p><h1 style="color:#5170ff">A place is ready for ${input.childName}</h1><p>We are pleased to offer a place at The Afternoon Academy.</p><div style="background:#fff7e8;border-radius:12px;padding:20px"><p><strong>${dayName(input.weekday)} at ${input.startsAt.slice(0, 5)}</strong><br/>Table ${input.tableNumber}<br/>${formatDate(input.periodStart)} – ${formatDate(input.periodEnd)}<br/><strong>Total: ${formatEuros(input.amountCents)}</strong></p></div><h2>Pay by bank transfer</h2><ul>${paymentDetails}</ul><p>Please use the payment reference exactly as shown so we can match your transfer quickly.</p><p><a href="${input.offerUrl}" style="display:inline-block;background:#ff5757;color:white;padding:14px 20px;border-radius:8px;text-decoration:none">View and accept your offer</a></p><p>This place is held until ${input.expiresAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}. Once payment is confirmed, we will send a secure sign-in link for your TAA parent account.</p><p>Warmly,<br/>The Afternoon Academy</p></main>`,
  }
}

export async function createAndSendPlaceOffer(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = offerSchema.safeParse({
    parentLeadId: formData.get("parentLeadId"),
    childLeadId: formData.get("childLeadId"),
    templateId: formData.get("templateId"),
    seatNumber: formData.get("seatNumber"),
    amountEuros: formData.get("amountEuros"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    expiryHours: formData.get("expiryHours") || 48,
  })
  if (!parsed.success) throw new Error("Please complete the offer details")

  const value = parsed.data
  const supabase = supabaseService()
  const [{ data: parent }, { data: child }, { data: template }] = await Promise.all([
    supabase.from("parent_leads").select("parent_name,email").eq("id", value.parentLeadId).single(),
    supabase.from("child_leads").select("parent_lead_id,first_name").eq("id", value.childLeadId).single(),
    supabase.from("weekly_table_templates").select("weekday,table_number,academy_table_id,starts_at,duration_minutes,status").eq("id", value.templateId).single(),
  ])
  if (!parent || !child || child.parent_lead_id !== value.parentLeadId || !template || template.status !== "active") {
    throw new Error("The selected family or timetable place is no longer available")
  }

  const { data: table } = await supabase.from("academy_tables").select("seat_capacity,status").eq("id", template.academy_table_id).single()
  if (!table || table.status !== "active" || value.seatNumber > table.seat_capacity) {
    throw new Error("Choose an available seat on an active Academy table")
  }

  const { data: held } = await supabase.from("place_offers").select("id").eq("weekday", template.weekday).eq("academy_table_id", template.academy_table_id).eq("starts_at", template.starts_at).eq("seat_number", value.seatNumber).in("status", ["draft","sent","viewed","accepted"]).maybeSingle()
  if (held) throw new Error("That recurring seat is already held for another family")

  const token = randomBytes(32).toString("base64url")
  const reference = `TAA-${randomBytes(4).toString("hex").toUpperCase()}`
  const expiresAt = new Date(Date.now() + value.expiryHours * 60 * 60 * 1000)
  const amountCents = Math.round(value.amountEuros * 100)
  const { data: offer, error: offerError } = await supabase.from("place_offers").insert({
    parent_lead_id: value.parentLeadId, child_lead_id: value.childLeadId, weekly_table_template_id: value.templateId,
    academy_table_id: template.academy_table_id, weekday: template.weekday, table_number: template.table_number,
    seat_number: value.seatNumber, starts_at: template.starts_at, duration_minutes: template.duration_minutes,
    amount_cents: amountCents, service_period_start: value.periodStart, service_period_end: value.periodEnd,
    payment_reference: reference, access_token_hash: hashToken(token), expires_at: expiresAt.toISOString(), created_by: user.id,
  }).select("id").single()
  if (offerError || !offer) throw new Error("Could not create the place offer")

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://theafternoonacademy.com"
  const message = placeOfferEmail({
    parentName: parent.parent_name, childName: child.first_name || "your child", weekday: template.weekday,
    startsAt: template.starts_at, tableNumber: template.table_number, periodStart: value.periodStart,
    periodEnd: value.periodEnd, amountCents, paymentReference: reference, expiresAt, offerUrl: `${siteUrl}/offer/${token}`,
  })
  const idempotencyKey = `place-offer-${offer.id}`
  const { data: delivery } = await supabase.from("email_delivery_log").insert({
    parent_lead_id: value.parentLeadId, place_offer_id: offer.id, email_kind: "place_offer",
    recipient_email: parent.email, idempotency_key: idempotencyKey, created_by: user.id,
  }).select("id").single()

  try {
    const { data, error } = await getResend().emails.send({
      from: emailFrom, to: [parent.email], subject: message.subject, html: message.html, text: message.text,
      headers: { "Idempotency-Key": idempotencyKey },
    })
    if (error) throw new Error(error.message)
    await Promise.all([
      supabase.from("place_offers").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", offer.id),
      supabase.from("email_delivery_log").update({ status: "sent", resend_email_id: data?.id || null, sent_at: new Date().toISOString() }).eq("id", delivery?.id || ""),
      supabase.from("parent_leads").update({ status: "offer_sent", offer_sent_at: new Date().toISOString(), offer_sent_by: user.id }).eq("id", value.parentLeadId),
    ])
  } catch (error) {
    await Promise.all([
      supabase.from("place_offers").update({ status: "cancelled" }).eq("id", offer.id),
      delivery ? supabase.from("email_delivery_log").update({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "Send failed" }).eq("id", delivery.id) : Promise.resolve(),
    ])
    throw new Error("The offer was saved but the email could not be sent. The seat has been released.")
  }

  revalidatePath("/admin/leads")
  revalidatePath("/admin/place-offers")
}

export async function acceptPlaceOffer(formData: FormData) {
  const token = String(formData.get("token") || "")
  if (!token) throw new Error("This offer link is invalid")
  const supabase = supabaseService()
  const { data: offer } = await supabase.from("place_offers").select("*").eq("access_token_hash", hashToken(token)).maybeSingle()
  if (!offer || !["sent","viewed"].includes(offer.status) || new Date(offer.expires_at) < new Date()) {
    throw new Error("This offer is no longer available")
  }

  const { data: alreadyHeld } = await supabase.from("accepted_bookings").select("id").eq("weekday", offer.weekday).eq("academy_table_id", offer.academy_table_id).eq("starts_at", offer.starts_at).eq("seat_number", offer.seat_number).in("status", ["accepted_awaiting_payment","paid_active"]).maybeSingle()
  if (alreadyHeld) throw new Error("This place is no longer available")

  const { error: bookingError } = await supabase.from("accepted_bookings").insert({
    parent_lead_id: offer.parent_lead_id, child_lead_id: offer.child_lead_id, weekday: offer.weekday,
    table_number: offer.table_number, academy_table_id: offer.academy_table_id, seat_number: offer.seat_number,
    starts_at: offer.starts_at, duration_minutes: offer.duration_minutes,
  })
  if (bookingError) throw new Error("This place is no longer available")

  await Promise.all([
    supabase.from("place_offers").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", offer.id),
    supabase.from("parent_leads").update({ status: "accepted_awaiting_payment" }).eq("id", offer.parent_lead_id),
  ])
  revalidatePath("/admin/leads")
}
