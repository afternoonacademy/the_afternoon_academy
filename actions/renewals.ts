"use server"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { allocateDatedOperationsSeat, assertPaidPeriodCapacity, type DatedCapacityRequest } from "@/lib/delivery-capacity"
import { getResend, emailFrom } from "@/lib/resend"
import { supabaseService } from "@/lib/supabase/service"
import {
  childPeriodHeading,
  formatAcademyServiceGroups,
  formatPaymentReference,
} from "@/lib/email/academy-period-email.mjs"
import {
  buildPaymentDetails,
  renewalTemplateContract,
} from "@/lib/email/parent-template-contract.mjs"

const caseSchema = z.object({ caseId: z.string().uuid(), parentLeadId: z.string().uuid() })
const dateRangeSchema = caseSchema.extend({ periodStart: z.string().date(), periodEnd: z.string().date(), pricePlanId: z.string().uuid() }).refine((value) => value.periodEnd >= value.periodStart, { message: "End date must follow start date" })
const defaultSubject = renewalTemplateContract.defaultSubject
const defaultBody = renewalTemplateContract.defaultBody
const iso = (value: Date) => value.toISOString().slice(0, 10)
const addDays = (value: string, days: number) => { const date = new Date(`${value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return iso(date) }
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;")
const emailHtml = (body: string) => `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#20304a;line-height:1.55">${escapeHtml(body).replaceAll("\n", "<br />")}</main>`

async function buildRenewalDates(parentLeadId: string, periodStart: string, periodEnd: string, pricePlanId?: string) {
  const supabase = supabaseService()
  const [{ data: learners }, { data: placements }, { data: closures }] = await Promise.all([
    supabase.from("learners").select("id,first_name").eq("parent_lead_id", parentLeadId).eq("status", "active"),
    supabase.from("standing_placements").select("id,learner_id,weekday,academy_table_id,table_number,seat_number,starts_at,duration_minutes,teacher_name,focus,session_price_plans(price_cents)").eq("status", "active").lte("effective_from", periodEnd).or(`effective_to.is.null,effective_to.gte.${periodStart}`),
    supabase.from("academy_closures").select("starts_on,ends_on").lte("starts_on", periodEnd).gte("ends_on", periodStart),
  ])
  const pricePlan = pricePlanId ? await supabase.from("session_price_plans").select("price_cents").eq("id", pricePlanId).eq("status", "active").maybeSingle() : null
  if (pricePlanId && (!pricePlan || pricePlan.error || !pricePlan.data)) throw new Error("Choose an active price plan for this renewal")
  const learnerNamesById = new Map((learners || []).map((learner) => [learner.id, learner.first_name || "Learner"])); const learnerIds = new Set(learnerNamesById.keys()); const sessions: any[] = []
  for (const placement of (placements || []).filter((item) => learnerIds.has(item.learner_id))) for (let cursor = periodStart; cursor <= periodEnd; cursor = addDays(cursor, 1)) {
    if (new Date(`${cursor}T12:00:00Z`).getUTCDay() !== placement.weekday || (closures || []).some((closure) => closure.starts_on <= cursor && closure.ends_on >= cursor)) continue
    const plan = placement.session_price_plans && (Array.isArray(placement.session_price_plans) ? placement.session_price_plans[0] : placement.session_price_plans)
    sessions.push({ placementId: placement.id, learnerId: placement.learner_id, learnerName: learnerNamesById.get(placement.learner_id) || "Learner", date: cursor, startsAt: placement.starts_at.slice(0, 5), priceCents: pricePlan?.data?.price_cents ?? plan?.price_cents ?? null, academyTableId: placement.academy_table_id, tableNumber: placement.table_number, seatNumber: null, durationMinutes: placement.duration_minutes, teacherName: placement.teacher_name, focus: placement.focus, replacement: false })
  }
  return { dates: [...new Set(sessions.map((session) => session.date))].sort(), sessions, learnerNames: (learners || []).map((learner) => learner.first_name).filter(Boolean).join(", ") || "your child" }
}
const applyTemplate = (template: string, values: Record<string, string>) => Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, value), template)
const formatRenewalServiceDates = (sessions: any[]) =>
  formatAcademyServiceGroups(sessions, { initialPeriod: false })

const renewalPaymentDetails = () =>
  buildPaymentDetails({
    businessName: process.env.TAA_BUSINESS_NAME || "",
    accountName: process.env.TAA_BANK_ACCOUNT_NAME || "",
    iban: process.env.TAA_BANK_IBAN || "",
  }) || "Please use the usual Academy bank-transfer details."


export async function startChildRenewalCase(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = z
    .object({
      parentLeadId: z.string().uuid(),
      learnerId: z.string().uuid(),
      standingPlacementId: z.string().uuid(),
      sourcePaymentEntitlementId: z.string().uuid(),
      dueOn: z.string().date(),
    })
    .safeParse({
      parentLeadId: formData.get("parentLeadId"),
      learnerId: formData.get("learnerId"),
      standingPlacementId: formData.get("standingPlacementId"),
      sourcePaymentEntitlementId: formData.get("sourcePaymentEntitlementId"),
      dueOn: formData.get("dueOn"),
    })

  if (!parsed.success) throw new Error("This renewal is no longer available")

  const value = parsed.data
  const supabase = supabaseService()
  const [{ data: learner }, { data: placement }, { data: existing }] =
    await Promise.all([
      supabase
        .from("learners")
        .select("id,parent_lead_id,status")
        .eq("id", value.learnerId)
        .maybeSingle(),
      supabase
        .from("standing_placements")
        .select("id,learner_id,status")
        .eq("id", value.standingPlacementId)
        .maybeSingle(),
      supabase
        .from("renewal_cases")
        .select("id")
        .eq("learner_id", value.learnerId)
        .eq("source_payment_entitlement_id", value.sourcePaymentEntitlementId)
        .maybeSingle(),
    ])

  if (
    !learner ||
    learner.parent_lead_id !== value.parentLeadId ||
    learner.status !== "active" ||
    !placement ||
    placement.learner_id !== value.learnerId ||
    placement.status !== "active"
  ) {
    throw new Error("The learner’s recurring place is no longer active")
  }

  const payload = {
    parent_lead_id: value.parentLeadId,
    learner_id: value.learnerId,
    standing_placement_id: value.standingPlacementId,
    source_payment_entitlement_id: value.sourcePaymentEntitlementId,
    due_on: value.dueOn,
    status: value.dueOn < iso(new Date()) ? "overdue" : "ready_to_send",
    updated_by: user.id,
  }

  const result = existing
    ? await supabase.from("renewal_cases").update(payload).eq("id", existing.id)
    : await supabase.from("renewal_cases").insert(payload)

  if (result.error) throw new Error("Could not open the renewal")

  revalidatePath("/admin")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads")
}

export async function releaseRenewalPlace(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = z
    .object({
      caseId: z.string().uuid().optional(),
      parentLeadId: z.string().uuid(),
      learnerId: z.string().uuid(),
      sourcePaymentEntitlementId: z.string().uuid(),
      reason: z.string().trim().min(2).max(500),
    })
    .safeParse({
      caseId: formData.get("caseId") || undefined,
      parentLeadId: formData.get("parentLeadId"),
      learnerId: formData.get("learnerId"),
      sourcePaymentEntitlementId: formData.get("sourcePaymentEntitlementId"),
      reason: formData.get("reason"),
    })

  if (!parsed.success) {
    throw new Error("Add a reason before releasing the recurring place")
  }

  const value = parsed.data
  const supabase = supabaseService()

  let renewalId = value.caseId || null
  if (renewalId) {
    const { data: renewal } = await supabase
      .from("renewal_cases")
      .select("id,learner_id,status")
      .eq("id", renewalId)
      .eq("parent_lead_id", value.parentLeadId)
      .maybeSingle()

    if (!renewal || renewal.learner_id !== value.learnerId) {
      throw new Error("This renewal is no longer available")
    }
    if (renewal.status === "renewed") {
      throw new Error("This renewal has already been paid")
    }
  } else {
    const { data: existing } = await supabase
      .from("renewal_cases")
      .select("id,status")
      .eq("learner_id", value.learnerId)
      .eq("source_payment_entitlement_id", value.sourcePaymentEntitlementId)
      .maybeSingle()

    if (existing?.status === "renewed") {
      throw new Error("This renewal has already been paid")
    }

    if (existing) {
      renewalId = existing.id
    } else {
      const { data: created, error: createError } = await supabase
        .from("renewal_cases")
        .insert({
          parent_lead_id: value.parentLeadId,
          learner_id: value.learnerId,
          source_payment_entitlement_id: value.sourcePaymentEntitlementId,
          due_on: iso(new Date()),
          status: "not_renewing",
          updated_by: user.id,
        })
        .select("id")
        .single()

      if (createError || !created) {
        throw new Error("Could not create the renewal release record")
      }
      renewalId = created.id
    }
  }

  const releasedAt = new Date().toISOString()
  const [bookingResult, placementResult, renewalResult] = await Promise.all([
    supabase
      .from("accepted_bookings")
      .update({ status: "cancelled" })
      .eq("learner_id", value.learnerId)
      .in("status", [
        "paid_active",
        "session_planned",
        "contacted",
        "accepted_awaiting_payment",
      ]),
    supabase
      .from("standing_placements")
      .update({
        status: "ended",
        effective_to: iso(new Date()),
        updated_by: user.id,
      })
      .eq("learner_id", value.learnerId)
      .eq("status", "active"),
    supabase
      .from("renewal_cases")
      .update({
        status: "not_renewing",
        outcome_note: value.reason,
        capacity_released_at: releasedAt,
        capacity_released_by: user.id,
        capacity_release_reason: value.reason,
        closed_at: releasedAt,
        updated_by: user.id,
      })
      .eq("id", renewalId),
  ])

  if (bookingResult.error || placementResult.error || renewalResult.error) {
    console.error("Renewal capacity release failed", {
      bookingError: bookingResult.error,
      placementError: placementResult.error,
      renewalError: renewalResult.error,
    })
    throw new Error("Could not release the learner’s recurring place")
  }

  const { data: futureSessions, error: futureSessionsError } = await supabase
    .from("delivery_sessions")
    .select("id")
    .gte("service_date", iso(new Date()))

  if (futureSessionsError) {
    throw new Error(
      "The recurring place was released, but future renewal-due Operations seats could not be checked",
    )
  }

  const futureSessionIds = (futureSessions || []).map((session) => session.id)
  if (futureSessionIds.length) {
    const { error: futureSeatError } = await supabase
      .from("delivery_seats")
      .update({
        status: "cancelled",
        note: "Recurring place released: " + value.reason,
        updated_by: user.id,
      })
      .eq("learner_id", value.learnerId)
      .eq("status", "payment_pending")
      .in("delivery_session_id", futureSessionIds)

    if (futureSeatError) {
      throw new Error(
        "The recurring place was released, but future renewal-due Operations seats could not be cleared",
      )
    }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/renewals")
}


export async function startRenewalCase(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = z.object({ parentLeadId: z.string().uuid(), sourcePaymentEntitlementId: z.string().uuid(), dueOn: z.string().date() }).safeParse({ parentLeadId: formData.get("parentLeadId"), sourcePaymentEntitlementId: formData.get("sourcePaymentEntitlementId"), dueOn: formData.get("dueOn") })
  if (!parsed.success) throw new Error("This renewal is no longer available")
  const { error } = await supabaseService().from("renewal_cases").upsert({ parent_lead_id: parsed.data.parentLeadId, source_payment_entitlement_id: parsed.data.sourcePaymentEntitlementId, due_on: parsed.data.dueOn, status: parsed.data.dueOn < iso(new Date()) ? "overdue" : "ready_to_send", updated_by: user.id }, { onConflict: "parent_lead_id,source_payment_entitlement_id" })
  if (error) throw new Error("Could not open the renewal")
  revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads")
}

export async function prepareRenewalDraft(formData: FormData) {
  const { user } = await requireAdmin(); const parsed = dateRangeSchema.safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId"), periodStart: formData.get("periodStart"), periodEnd: formData.get("periodEnd"), pricePlanId: formData.get("pricePlanId") })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Check the renewal dates and amount")
  const value = parsed.data; const supabase = supabaseService()
  const [{ data: parent }, { data: template }, service] = await Promise.all([supabase.from("parent_leads").select("parent_name").eq("id", value.parentLeadId).single(), supabase.from("academy_email_templates").select("subject_template,body_template").eq("template_key", "renewal_reminder").maybeSingle(), buildRenewalDates(value.parentLeadId, value.periodStart, value.periodEnd, value.pricePlanId)])
  if (!parent) throw new Error("Could not load this family"); if (!service.sessions.length) throw new Error("There are no open Academy session dates in this period"); if (service.sessions.some((session) => session.priceCents === null)) throw new Error("Set the missing session price in Academy Setup before preparing this renewal")
  const amountCents = service.sessions.reduce((total, session) => total + (session.priceCents || 0), 0); const learnerLabel = [...new Set(service.sessions.map((session) => session.learnerName).filter(Boolean))].join(", ") || service.learnerNames; const values = { parent_name: parent.parent_name, learner_names: learnerLabel, period_heading: childPeriodHeading(learnerLabel, "renewal"), service_dates: formatRenewalServiceDates(service.sessions), session_count: String(service.sessions.length), amount_due: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(amountCents / 100), payment_details: renewalPaymentDetails(), payment_reference: formatPaymentReference(learnerLabel, service.sessions) }
  const { error } = await supabase.from("renewal_cases").update({ proposed_period_start: value.periodStart, proposed_period_end: value.periodEnd, proposed_session_price_plan_id: value.pricePlanId, proposed_amount_cents: amountCents, proposed_service_dates: service.dates, selected_sessions: service.sessions, selected_session_count: service.sessions.length, draft_subject: applyTemplate(template?.subject_template || defaultSubject, values), draft_body: applyTemplate(template?.body_template || defaultBody, values), updated_by: user.id }).eq("id", value.caseId).eq("parent_lead_id", value.parentLeadId)
  if (error) throw new Error("Could not prepare the renewal email"); revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads")
}

export async function updateRenewalSelection(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = caseSchema.safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId") })
  if (!parsed.success) throw new Error("This renewal is no longer available")
  const keys = new Set(formData.getAll("sessionKey").filter((value): value is string => typeof value === "string"))
  const supabase = supabaseService()
  const [{ data: renewal }, { data: parent }, { data: template }] = await Promise.all([
    supabase.from("renewal_cases").select("selected_sessions,proposed_period_start,proposed_period_end").eq("id", parsed.data.caseId).eq("parent_lead_id", parsed.data.parentLeadId).single(),
    supabase.from("parent_leads").select("parent_name").eq("id", parsed.data.parentLeadId).single(),
    supabase.from("academy_email_templates").select("subject_template,body_template").eq("template_key", "renewal_reminder").maybeSingle(),
  ])
  if (!renewal || !parent) throw new Error("This renewal is no longer available")
  const sessions = Array.isArray(renewal.selected_sessions) ? renewal.selected_sessions.filter((session): session is { date: string; startsAt: string; priceCents: number; placementId?: string } => Boolean(session && typeof session === "object" && typeof session.date === "string" && typeof session.startsAt === "string" && typeof session.priceCents === "number" && keys.has(`${session.placementId || "legacy"}|${session.date}|${session.startsAt}`))) : []
  if (!sessions.length) throw new Error("Choose at least one session")
  const amountCents = sessions.reduce((total, session) => total + session.priceCents, 0)
  const service = await buildRenewalDates(parsed.data.parentLeadId, renewal.proposed_period_start, renewal.proposed_period_end)
  const learnerLabel = [...new Set(sessions.map((session: any) => session.learnerName).filter(Boolean))].join(", ") || service.learnerNames
  const values = { parent_name: parent.parent_name, learner_names: learnerLabel, period_heading: childPeriodHeading(learnerLabel, "renewal"), service_dates: formatRenewalServiceDates(sessions), session_count: String(sessions.length), amount_due: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(amountCents / 100), payment_details: renewalPaymentDetails(), payment_reference: formatPaymentReference(learnerLabel, sessions) }
  const { error } = await supabase.from("renewal_cases").update({ proposed_amount_cents: amountCents, proposed_service_dates: [...new Set(sessions.map((session) => session.date))].sort(), selected_sessions: sessions, selected_session_count: sessions.length, draft_subject: applyTemplate(template?.subject_template || defaultSubject, values), draft_body: applyTemplate(template?.body_template || defaultBody, values), updated_by: user.id }).eq("id", parsed.data.caseId).eq("parent_lead_id", parsed.data.parentLeadId)
  if (error) throw new Error("Could not update the selected sessions")
  revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads")
}

export async function addRenewalReplacement(formData: FormData) {
  const { user } = await requireAdmin(); const parsed = caseSchema.extend({ placementId: z.string().uuid(), replacementDate: z.string().date() }).safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId"), placementId: formData.get("placementId"), replacementDate: formData.get("replacementDate") }); if (!parsed.success) throw new Error("Choose a learner and an open replacement date")
  const value = parsed.data; const supabase = supabaseService(); const [{ data: closure }, { data: placement }, { data: renewal }, { data: plan }] = await Promise.all([supabase.from("academy_closures").select("id").lte("starts_on", value.replacementDate).gte("ends_on", value.replacementDate).maybeSingle(), supabase.from("standing_placements").select("id,learner_id,academy_table_id,table_number,seat_number,starts_at,duration_minutes,teacher_name,focus,learners!inner(first_name,parent_lead_id)").eq("id", value.placementId).eq("status", "active").single(), supabase.from("renewal_cases").select("selected_sessions").eq("id", value.caseId).eq("parent_lead_id", value.parentLeadId).single(), supabase.from("renewal_cases").select("proposed_session_price_plan_id").eq("id", value.caseId).single()])
  if (closure) throw new Error("That date is an Academy closure. Choose an open date instead"); if (!placement || !renewal || !plan || (Array.isArray(placement.learners) ? placement.learners[0] : placement.learners)?.parent_lead_id !== value.parentLeadId) throw new Error("This learner place is no longer available")
  const { data: pricePlan } = await supabase.from("session_price_plans").select("price_cents").eq("id", plan.proposed_session_price_plan_id).eq("status", "active").single(); if (!pricePlan) throw new Error("Calculate the renewal plan before adding a replacement")
  const learner = Array.isArray(placement.learners) ? placement.learners[0] : placement.learners; const sessions = Array.isArray(renewal.selected_sessions) ? renewal.selected_sessions : []; if (sessions.some((item: any) => item.placementId === placement.id && item.date === value.replacementDate)) throw new Error("That learner already has this date in the renewal")
  const next = [...sessions, { placementId: placement.id, learnerId: placement.learner_id, learnerName: learner.first_name || "Learner", date: value.replacementDate, startsAt: placement.starts_at.slice(0, 5), priceCents: pricePlan.price_cents, academyTableId: placement.academy_table_id, tableNumber: placement.table_number, seatNumber: null, durationMinutes: placement.duration_minutes, teacherName: placement.teacher_name, focus: placement.focus, replacement: true }]; const amount = next.reduce((sum: number, item: any) => sum + item.priceCents, 0)
  const { error } = await supabase.from("renewal_cases").update({ selected_sessions: next, selected_session_count: next.length, proposed_amount_cents: amount, proposed_service_dates: [...new Set(next.map((item: any) => item.date))].sort(), updated_by: user.id }).eq("id", value.caseId); if (error) throw new Error("Could not add the replacement session"); revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads")
}

export async function sendRenewalEmail(formData: FormData) {
  const { user } = await requireAdmin(); const parsed = caseSchema.extend({ subject: z.string().trim().min(2).max(200), body: z.string().trim().min(2).max(12000) }).safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId"), subject: formData.get("subject"), body: formData.get("body") })
  if (!parsed.success) throw new Error("Check the email before sending")
  const value = parsed.data; const supabase = supabaseService(); const [{ data: parent }, { data: renewal }] = await Promise.all([supabase.from("parent_leads").select("email").eq("id", value.parentLeadId).single(), supabase.from("renewal_cases").select("id,status,learner_id").eq("id", value.caseId).eq("parent_lead_id", value.parentLeadId).single()])
  if (!parent || !renewal) throw new Error("This renewal is no longer available"); if (renewal.status === "renewed" || renewal.status === "not_renewing") throw new Error("This renewal is already complete")
  const key = `renewal-${renewal.id}`; const { data: existing } = await supabase.from("email_delivery_log").select("id,status").eq("idempotency_key", key).maybeSingle(); if (existing && ["sent", "delivered", "delayed"].includes(existing.status)) throw new Error("This renewal email has already been sent")
  if (existing?.status === "bounced") throw new Error("The previous renewal email bounced. Check the parent email address before retrying.")
  const { data: log, error: logError } = existing ? { data: existing, error: null } : await supabase.from("email_delivery_log").insert({ parent_lead_id: value.parentLeadId, learner_id: renewal.learner_id, renewal_case_id: renewal.id, email_kind: "renewal_reminder", recipient_email: parent.email, idempotency_key: key, subject: value.subject, body_text: value.body, created_by: user.id }).select("id").single(); if (logError || !log) throw new Error("Could not prepare the renewal email")
  try { const result = await getResend().emails.send({ from: emailFrom, to: [parent.email], subject: value.subject, html: emailHtml(value.body), text: value.body }, { headers: { "Idempotency-Key": key } }); if (result.error) throw new Error(result.error.message); await Promise.all([supabase.from("email_delivery_log").update({ status: "sent", resend_email_id: result.data?.id || null, sent_at: new Date().toISOString(), subject: value.subject, body_text: value.body }).eq("id", log.id), supabase.from("renewal_cases").update({ status: "awaiting_payment", email_sent_at: new Date().toISOString(), last_contact_at: new Date().toISOString(), draft_subject: value.subject, draft_body: value.body, updated_by: user.id }).eq("id", renewal.id)]) } catch (error) { await supabase.from("email_delivery_log").update({ status: "failed", failed_at: new Date().toISOString(), error_message: error instanceof Error ? error.message.slice(0, 500) : "Send failed" }).eq("id", log.id); throw new Error("The renewal email could not be sent") }
  revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads")
}

export async function allowPendingRenewalAttendance(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = caseSchema
    .extend({ throughDate: z.string().date() })
    .safeParse({
      caseId: formData.get("caseId"),
      parentLeadId: formData.get("parentLeadId"),
      throughDate: formData.get("throughDate"),
    })
  if (!parsed.success) {
    throw new Error("Choose the date through which attendance may continue")
  }

  const value = parsed.data
  const start = iso(new Date())
  if (value.throughDate < start) {
    throw new Error("Choose a future continuation date")
  }

  const supabase = supabaseService()
  const { dates } = await buildRenewalDates(
    value.parentLeadId,
    start,
    value.throughDate,
  )
  const [{ data: learners }, { data: placements }, { data: renewal }] =
    await Promise.all([
      supabase
        .from("learners")
        .select("id")
        .eq("parent_lead_id", value.parentLeadId)
        .eq("status", "active"),
      supabase
        .from("standing_placements")
        .select(
          "id,learner_id,weekday,table_number,academy_table_id,starts_at,duration_minutes,teacher_name,focus",
        )
        .eq("status", "active"),
      supabase
        .from("renewal_cases")
        .select("status")
        .eq("id", value.caseId)
        .eq("parent_lead_id", value.parentLeadId)
        .single(),
    ])

  if (
    !renewal ||
    renewal.status === "renewed" ||
    renewal.status === "not_renewing"
  ) {
    throw new Error("This renewal cannot continue attendance")
  }

  const learnerIds = new Set((learners || []).map((learner) => learner.id))
  const requests: (DatedCapacityRequest & { learnerId: string })[] = []

  for (const placement of (placements || []).filter((item) =>
    learnerIds.has(item.learner_id),
  )) {
    for (const serviceDate of dates.filter(
      (day) =>
        new Date(`${day}T12:00:00Z`).getUTCDay() === placement.weekday,
    )) {
      requests.push({
        learnerId: placement.learner_id,
        placementId: placement.id,
        date: serviceDate,
        academyTableId: placement.academy_table_id,
        tableNumber: placement.table_number,
        startsAt: placement.starts_at.slice(0, 5),
        durationMinutes: placement.duration_minutes,
        teacherName: placement.teacher_name,
        focus: placement.focus,
      })
    }
  }

  await assertPaidPeriodCapacity(requests, supabase)

  for (const request of requests) {
    await allocateDatedOperationsSeat({
      session: request,
      learnerId: request.learnerId,
      userId: user.id,
      status: "payment_pending",
      note: "Renewal payment pending",
      supabase,
    })
  }

  const { error } = await supabase
    .from("renewal_cases")
    .update({
      provisional_delivery_until: value.throughDate,
      provisional_delivery_enabled_at: new Date().toISOString(),
      provisional_delivery_enabled_by: user.id,
      updated_by: user.id,
    })
    .eq("id", value.caseId)

  if (error) {
    throw new Error(
      "Attendance was prepared, but its payment-pending marker could not be saved",
    )
  }

  revalidatePath("/admin")
  revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads")
}


export async function closeRenewal(formData: FormData) { const { user } = await requireAdmin(); const parsed = caseSchema.extend({ note: z.string().trim().max(500).optional() }).safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId"), note: formData.get("note") || undefined }); if (!parsed.success) throw new Error("Please check the renewal outcome"); const { error } = await supabaseService().from("renewal_cases").update({ status: "not_renewing", outcome_note: parsed.data.note || null, closed_at: new Date().toISOString(), updated_by: user.id }).eq("id", parsed.data.caseId).eq("parent_lead_id", parsed.data.parentLeadId); if (error) throw new Error("Could not close this renewal"); revalidatePath("/admin/renewals")
  revalidatePath("/admin/leads") }
