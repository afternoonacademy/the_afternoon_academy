"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { getResend, emailFrom } from "@/lib/resend"
import { supabaseService } from "@/lib/supabase/service"

const caseSchema = z.object({ caseId: z.string().uuid(), parentLeadId: z.string().uuid() })
const dateRangeSchema = caseSchema.extend({ periodStart: z.string().date(), periodEnd: z.string().date() }).refine((value) => value.periodEnd >= value.periodStart, { message: "End date must follow start date" })
const defaultSubject = "Renewal for {{learner_names}} at The Afternoon Academy"
const defaultBody = "Hello {{parent_name}},\n\nYour next Academy period includes:\n{{service_dates}}\n\nThat is {{session_count}} session(s), totalling {{amount_due}}.\n\nIf you would like to continue, please make your usual bank transfer. We will confirm the period once the funds have cleared.\n\nWarmly,\nThe Afternoon Academy"
const iso = (value: Date) => value.toISOString().slice(0, 10)
const addDays = (value: string, days: number) => { const date = new Date(`${value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return iso(date) }
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;")
const emailHtml = (body: string) => `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#20304a;line-height:1.55">${escapeHtml(body).replaceAll("\n", "<br />")}</main>`
const formatDate = (value: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00Z`))

async function buildRenewalDates(parentLeadId: string, periodStart: string, periodEnd: string) {
  const supabase = supabaseService()
  const [{ data: learners }, { data: placements }, { data: closures }] = await Promise.all([
    supabase.from("learners").select("id,first_name").eq("parent_lead_id", parentLeadId).eq("status", "active"),
    supabase.from("standing_placements").select("learner_id,weekday,academy_table_id,starts_at").eq("status", "active").lte("effective_from", periodEnd).or(`effective_to.is.null,effective_to.gte.${periodStart}`),
    supabase.from("academy_closures").select("starts_on,ends_on").lte("starts_on", periodEnd).gte("ends_on", periodStart),
  ])
  const rates = await supabase.from("weekly_table_templates").select("weekday,academy_table_id,starts_at,session_price_cents").eq("status", "active")
  const learnerIds = new Set((learners || []).map((learner) => learner.id)); const sessions: { date: string; startsAt: string; priceCents: number | null }[] = []
  for (const placement of (placements || []).filter((item) => learnerIds.has(item.learner_id))) for (let cursor = periodStart; cursor <= periodEnd; cursor = addDays(cursor, 1)) {
    if (new Date(`${cursor}T12:00:00Z`).getUTCDay() !== placement.weekday || (closures || []).some((closure) => closure.starts_on <= cursor && closure.ends_on >= cursor)) continue
    const rate = (rates.data || []).find((item) => item.weekday === placement.weekday && item.academy_table_id === placement.academy_table_id && item.starts_at.slice(0, 5) === placement.starts_at.slice(0, 5))
    sessions.push({ date: cursor, startsAt: placement.starts_at.slice(0, 5), priceCents: rate?.session_price_cents ?? null })
  }
  return { dates: [...new Set(sessions.map((session) => session.date))].sort(), sessions, learnerNames: (learners || []).map((learner) => learner.first_name).filter(Boolean).join(", ") || "your child" }
}
const applyTemplate = (template: string, values: Record<string, string>) => Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, value), template)

export async function startRenewalCase(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = z.object({ parentLeadId: z.string().uuid(), sourcePaymentEntitlementId: z.string().uuid(), dueOn: z.string().date() }).safeParse({ parentLeadId: formData.get("parentLeadId"), sourcePaymentEntitlementId: formData.get("sourcePaymentEntitlementId"), dueOn: formData.get("dueOn") })
  if (!parsed.success) throw new Error("This renewal is no longer available")
  const { error } = await supabaseService().from("renewal_cases").upsert({ parent_lead_id: parsed.data.parentLeadId, source_payment_entitlement_id: parsed.data.sourcePaymentEntitlementId, due_on: parsed.data.dueOn, status: parsed.data.dueOn < iso(new Date()) ? "overdue" : "ready_to_send", updated_by: user.id }, { onConflict: "parent_lead_id,source_payment_entitlement_id" })
  if (error) throw new Error("Could not open the renewal")
  revalidatePath("/admin/renewals")
}

export async function prepareRenewalDraft(formData: FormData) {
  const { user } = await requireAdmin(); const parsed = dateRangeSchema.safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId"), periodStart: formData.get("periodStart"), periodEnd: formData.get("periodEnd") })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Check the renewal dates and amount")
  const value = parsed.data; const supabase = supabaseService()
  const [{ data: parent }, { data: template }, service] = await Promise.all([supabase.from("parent_leads").select("parent_name").eq("id", value.parentLeadId).single(), supabase.from("academy_email_templates").select("subject_template,body_template").eq("template_key", "renewal_reminder").maybeSingle(), buildRenewalDates(value.parentLeadId, value.periodStart, value.periodEnd)])
  if (!parent) throw new Error("Could not load this family"); if (!service.sessions.length) throw new Error("There are no open Academy session dates in this period"); if (service.sessions.some((session) => session.priceCents === null)) throw new Error("Set the missing session price in Academy Setup before preparing this renewal")
  const amountCents = service.sessions.reduce((total, session) => total + (session.priceCents || 0), 0); const values = { parent_name: parent.parent_name, learner_names: service.learnerNames, service_dates: service.sessions.map((session) => `${formatDate(session.date)} · ${session.startsAt}`).join("\n"), session_count: String(service.sessions.length), amount_due: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(amountCents / 100) }
  const { error } = await supabase.from("renewal_cases").update({ proposed_period_start: value.periodStart, proposed_period_end: value.periodEnd, proposed_amount_cents: amountCents, proposed_service_dates: service.dates, selected_sessions: service.sessions, selected_session_count: service.sessions.length, draft_subject: applyTemplate(template?.subject_template || defaultSubject, values), draft_body: applyTemplate(template?.body_template || defaultBody, values), updated_by: user.id }).eq("id", value.caseId).eq("parent_lead_id", value.parentLeadId)
  if (error) throw new Error("Could not prepare the renewal email"); revalidatePath("/admin/renewals")
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
  const sessions = Array.isArray(renewal.selected_sessions) ? renewal.selected_sessions.filter((session): session is { date: string; startsAt: string; priceCents: number } => Boolean(session && typeof session === "object" && typeof session.date === "string" && typeof session.startsAt === "string" && typeof session.priceCents === "number" && keys.has(`${session.date}|${session.startsAt}`))) : []
  if (!sessions.length) throw new Error("Choose at least one session")
  const amountCents = sessions.reduce((total, session) => total + session.priceCents, 0)
  const service = await buildRenewalDates(parsed.data.parentLeadId, renewal.proposed_period_start, renewal.proposed_period_end)
  const values = { parent_name: parent.parent_name, learner_names: service.learnerNames, service_dates: sessions.map((session) => `${formatDate(session.date)} · ${session.startsAt}`).join("\n"), session_count: String(sessions.length), amount_due: new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(amountCents / 100) }
  const { error } = await supabase.from("renewal_cases").update({ proposed_amount_cents: amountCents, proposed_service_dates: [...new Set(sessions.map((session) => session.date))].sort(), selected_sessions: sessions, selected_session_count: sessions.length, draft_subject: applyTemplate(template?.subject_template || defaultSubject, values), draft_body: applyTemplate(template?.body_template || defaultBody, values), updated_by: user.id }).eq("id", parsed.data.caseId).eq("parent_lead_id", parsed.data.parentLeadId)
  if (error) throw new Error("Could not update the selected sessions")
  revalidatePath("/admin/renewals")
}

export async function sendRenewalEmail(formData: FormData) {
  const { user } = await requireAdmin(); const parsed = caseSchema.extend({ subject: z.string().trim().min(2).max(200), body: z.string().trim().min(2).max(12000) }).safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId"), subject: formData.get("subject"), body: formData.get("body") })
  if (!parsed.success) throw new Error("Check the email before sending")
  const value = parsed.data; const supabase = supabaseService(); const [{ data: parent }, { data: renewal }] = await Promise.all([supabase.from("parent_leads").select("email").eq("id", value.parentLeadId).single(), supabase.from("renewal_cases").select("id,status").eq("id", value.caseId).eq("parent_lead_id", value.parentLeadId).single()])
  if (!parent || !renewal) throw new Error("This renewal is no longer available"); if (renewal.status === "renewed" || renewal.status === "not_renewing") throw new Error("This renewal is already complete")
  const key = `renewal-${renewal.id}`; const { data: existing } = await supabase.from("email_delivery_log").select("id,status").eq("idempotency_key", key).maybeSingle(); if (existing?.status === "sent") throw new Error("This renewal email has already been sent")
  const { data: log, error: logError } = existing ? { data: existing, error: null } : await supabase.from("email_delivery_log").insert({ parent_lead_id: value.parentLeadId, email_kind: "renewal_reminder", recipient_email: parent.email, idempotency_key: key, subject: value.subject, body_text: value.body, created_by: user.id }).select("id").single(); if (logError || !log) throw new Error("Could not prepare the renewal email")
  try { const result = await getResend().emails.send({ from: emailFrom, to: [parent.email], subject: value.subject, html: emailHtml(value.body), text: value.body }, { headers: { "Idempotency-Key": key } }); if (result.error) throw new Error(result.error.message); await Promise.all([supabase.from("email_delivery_log").update({ status: "sent", resend_email_id: result.data?.id || null, sent_at: new Date().toISOString(), subject: value.subject, body_text: value.body }).eq("id", log.id), supabase.from("renewal_cases").update({ status: "awaiting_payment", email_sent_at: new Date().toISOString(), last_contact_at: new Date().toISOString(), draft_subject: value.subject, draft_body: value.body, updated_by: user.id }).eq("id", renewal.id)]) } catch (error) { await supabase.from("email_delivery_log").update({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "Send failed" }).eq("id", log.id); throw new Error("The renewal email could not be sent") }
  revalidatePath("/admin/renewals")
}

export async function allowPendingRenewalAttendance(formData: FormData) {
  const { user } = await requireAdmin(); const parsed = caseSchema.extend({ throughDate: z.string().date() }).safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId"), throughDate: formData.get("throughDate") }); if (!parsed.success) throw new Error("Choose the date through which attendance may continue")
  const value = parsed.data; const start = iso(new Date()); if (value.throughDate < start) throw new Error("Choose a future continuation date"); const supabase = supabaseService(); const { dates } = await buildRenewalDates(value.parentLeadId, start, value.throughDate)
  const [{ data: learners }, { data: placements }, { data: renewal }] = await Promise.all([supabase.from("learners").select("id").eq("parent_lead_id", value.parentLeadId).eq("status", "active"), supabase.from("standing_placements").select("learner_id,weekday,table_number,academy_table_id,seat_number,starts_at,duration_minutes,teacher_name,focus").eq("status", "active"), supabase.from("renewal_cases").select("status").eq("id", value.caseId).eq("parent_lead_id", value.parentLeadId).single()])
  if (!renewal || renewal.status === "renewed" || renewal.status === "not_renewing") throw new Error("This renewal cannot continue attendance"); const learnerIds = new Set((learners || []).map((learner) => learner.id))
  for (const placement of (placements || []).filter((item) => learnerIds.has(item.learner_id))) for (const serviceDate of dates.filter((day) => new Date(`${day}T12:00:00Z`).getUTCDay() === placement.weekday)) { const { data: session, error: sessionError } = await supabase.from("delivery_sessions").upsert({ service_date: serviceDate, table_number: placement.table_number, academy_table_id: placement.academy_table_id, starts_at: placement.starts_at, duration_minutes: placement.duration_minutes, teacher_name: placement.teacher_name, focus: placement.focus, status: "scheduled", created_by: user.id, updated_by: user.id }, { onConflict: "service_date,academy_table_id,starts_at" }).select("id").single(); if (sessionError || !session) throw new Error("Could not prepare the pending-payment delivery session"); const { data: occupied } = await supabase.from("delivery_seats").select("learner_id").eq("delivery_session_id", session.id).eq("seat_number", placement.seat_number).in("status", ["scheduled", "payment_pending"]).maybeSingle(); if (occupied && occupied.learner_id !== placement.learner_id) throw new Error("A reserved seat is occupied for one of these dates"); const { error: seatError } = await supabase.from("delivery_seats").upsert({ delivery_session_id: session.id, learner_id: placement.learner_id, seat_number: placement.seat_number, status: "payment_pending", note: "Renewal payment pending", updated_by: user.id }, { onConflict: "delivery_session_id,learner_id" }); if (seatError) throw new Error("Could not prepare a pending-payment seat") }
  const { error } = await supabase.from("renewal_cases").update({ provisional_delivery_until: value.throughDate, provisional_delivery_enabled_at: new Date().toISOString(), provisional_delivery_enabled_by: user.id, updated_by: user.id }).eq("id", value.caseId); if (error) throw new Error("Attendance was prepared, but its payment-pending marker could not be saved")
  revalidatePath("/admin"); revalidatePath("/admin/renewals")
}

export async function closeRenewal(formData: FormData) { const { user } = await requireAdmin(); const parsed = caseSchema.extend({ note: z.string().trim().max(500).optional() }).safeParse({ caseId: formData.get("caseId"), parentLeadId: formData.get("parentLeadId"), note: formData.get("note") || undefined }); if (!parsed.success) throw new Error("Please check the renewal outcome"); const { error } = await supabaseService().from("renewal_cases").update({ status: "not_renewing", outcome_note: parsed.data.note || null, closed_at: new Date().toISOString(), updated_by: user.id }).eq("id", parsed.data.caseId).eq("parent_lead_id", parsed.data.parentLeadId); if (error) throw new Error("Could not close this renewal"); revalidatePath("/admin/renewals") }
