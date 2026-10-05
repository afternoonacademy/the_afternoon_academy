import { z } from "zod"

import {
  paidPeriodSummary,
  sortPaidPeriodSessions,
  type PaidPeriodSession,
} from "@/lib/paid-period"
import {
  formatPlannedSessionGroups,
  renderPlannedPlaceEmailDraft,
} from "@/lib/email/planned-place-email.mjs"
import { supabaseService } from "@/lib/supabase/service"
import {
  childPeriodHeading,
  formatPaymentReference,
} from "@/lib/email/academy-period-email.mjs"

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
  sessionOrigin: z
    .enum(["recurring", "pre_agreed_exception", "replacement"])
    .optional(),
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
  "Hello {{parent_name}},\n\nWe hope you are well.\n\n{{period_heading}}\n\n{{service_dates}}\n\nThat is {{session_count}} session(s), totalling {{amount_due}}.\n\nIf you would like to take the place, please make your bank transfer.\n\n{{payment_details}}\n\nWarmly,\nThe Afternoon Academy"

function parseSessions(raw: unknown): PaidPeriodSession[] {
  const parsed = z.array(plannedSessionSchema).min(1).safeParse(raw)
  if (!parsed.success) {
    throw new Error("The planned service dates could not be read")
  }
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

export type PlannedPlaceEmailDraft = {
  to: string
  subject: string
  body: string
  bookingIds: string[]
}

export async function loadPlannedPlaceEmailDraft({
  parentLeadId,
  childLeadId,
}: {
  parentLeadId: string
  childLeadId: string
}): Promise<PlannedPlaceEmailDraft> {
  const supabase = supabaseService()

  const [
    { data: parent },
    { data: child },
    { data: bookings },
    { data: emailTemplate },
  ] = await Promise.all([
    supabase
      .from("parent_leads")
      .select("parent_name,email")
      .eq("id", parentLeadId)
      .single(),
    supabase
      .from("child_leads")
      .select("parent_lead_id,first_name")
      .eq("id", childLeadId)
      .single(),
    supabase
      .from("accepted_bookings")
      .select(
        "id,status,weekday,table_number,seat_number,starts_at,planned_sessions,planned_amount_cents,session_price_plan_id,session_price_plans(name,price_cents)",
      )
      .eq("parent_lead_id", parentLeadId)
      .eq("child_lead_id", childLeadId)
      .in("status", ["session_planned", "contacted"])
      .order("weekday")
      .order("starts_at"),
    supabase
      .from("academy_email_templates")
      .select("subject_template,body_template")
      .eq("template_key", "planned_place_offer")
      .maybeSingle(),
  ])

  if (
    !parent ||
    !child ||
    child.parent_lead_id !== parentLeadId ||
    !(bookings || []).length
  ) {
    throw new Error(
      "Plan the child’s recurring place before reviewing the parent email",
    )
  }

  const sessions = sortPaidPeriodSessions(
    (bookings || []).flatMap((booking) =>
      parseSessions(booking.planned_sessions || []),
    ),
  )
  const total = paidPeriodSummary(sessions).amountCents

  const recurringPlaces = (bookings || [])
    .map((booking) => {
      const relation = Array.isArray(booking.session_price_plans)
        ? booking.session_price_plans[0]
        : booking.session_price_plans

      return (
        weekdayNames[booking.weekday] +
        " · " +
        String(booking.starts_at).slice(0, 5) +
        " · Table " +
        booking.table_number +
        (relation
          ? " · " +
            relation.name +
            " · " +
            money(relation.price_cents) +
            " / session"
          : "")
      )
    })
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

  const sessionPrices = [
    ...new Set(sessions.map((session) => money(session.priceCents))),
  ]

  const datesText = formatPlannedSessionGroups(sessions)

  const bankName = process.env.TAA_BANK_ACCOUNT_NAME || ""
  const iban = process.env.TAA_BANK_IBAN || ""
  const childName = child.first_name || "your child"
  const paymentReference = formatPaymentReference(childName, sessions)
  const paymentDetails =
    bankName && iban
      ? "Payment details:\nAccount name: " +
        bankName +
        "\nIBAN: " +
        iban +
        "\nPayment reference: " +
        paymentReference
      : "Please use the usual Academy bank-transfer details.\nPayment reference: " +
        paymentReference

  const values: Record<string, string> = {
    parent_name: parent.parent_name,
    child_name: childName,
    period_heading: childPeriodHeading(childName, "initial"),
    recurring_place: recurringPlaces,
    price_plan_name: planNames.join(" / "),
    session_price:
      sessionPrices.length === 1
        ? sessionPrices[0]
        : sessionPrices.join(" / "),
    service_dates: datesText,
    session_count: String(sessions.length),
    amount_due: money(total),
    payment_details: paymentDetails,
    payment_reference: paymentReference,
  }

  const rendered = renderPlannedPlaceEmailDraft({
    subjectTemplate:
      emailTemplate?.subject_template || defaultPlannedPlaceSubject,
    bodyTemplate: emailTemplate?.body_template || defaultPlannedPlaceBody,
    values,
  })

  return {
    to: parent.email,
    subject: rendered.subject,
    body: rendered.body,
    bookingIds: (bookings || []).map((booking) => booking.id),
  }
}
