import "server-only"

import { sortPaidPeriodSessions, type PaidPeriodSession } from "@/lib/paid-period"
import type { supabaseService } from "@/lib/supabase/service"

export async function checkFamilyPaymentSchema(
  supabase: ReturnType<typeof supabaseService>,
): Promise<"ready" | "migration-required" | "unavailable"> {
  // Check only the schema, without reading or creating family payment rows.
  const { error } = await supabase.from("payment_entitlements")
    .select("session_revision")
    .limit(0)
  if (!error) return "ready"
  if ((error.code === "42703" || error.code === "PGRST204") &&
      error.message.includes("session_revision")) {
    return "migration-required"
  }
  console.error("Family payment readiness check failed", { code: error.code })
  return "unavailable"
}

export async function writeFamilyPaidSessions({
  supabase, parentLeadId, periodStart, periodEnd, learnerId, childLeadId,
  sessions, receivedOn, userId, note, recordPayment = true,
}: {
  supabase: ReturnType<typeof supabaseService>
  parentLeadId: string
  periodStart: string
  periodEnd: string
  learnerId?: string
  childLeadId?: string
  sessions: PaidPeriodSession[]
  receivedOn?: string
  userId?: string
  note?: string | null
  recordPayment?: boolean
}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: existing, error } = await supabase.from("payment_entitlements")
      .select("id,status,amount_cents,selected_sessions,sessions_per_week,session_revision")
      .eq("parent_lead_id", parentLeadId)
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd)
      .maybeSingle()
    if (error) throw new Error("The existing family payment could not be checked")
    const previous = Array.isArray(existing?.selected_sessions)
      ? existing.selected_sessions as PaidPeriodSession[] : []
    const belongsToChild = (session: PaidPeriodSession) =>
      Boolean((learnerId && learnerId === session.learnerId) ||
        (childLeadId && childLeadId === session.childLeadId))
    const previousChildValue = previous.filter(belongsToChild).reduce((sum, session) => sum + session.priceCents, 0)
    const nextChildValue = sessions.reduce((sum, session) => sum + session.priceCents, 0)
    const combined = sortPaidPeriodSessions([...previous.filter((session) => !belongsToChild(session)), ...sessions])
    const exactChanges = { selected_sessions: combined, selected_session_count: combined.length }
    const amount = (existing?.amount_cents ?? previous.reduce((sum, session) => sum + session.priceCents, 0)) +
      nextChildValue - previousChildValue
    if (recordPayment && (!Number.isInteger(amount) || amount < 0 || amount > 2147483647)) {
      throw new Error("The family payment amount is outside the supported range")
    }
    const paymentChanges = {
      status: "paid",
      amount_cents: amount,
      sessions_per_week: Math.min(7, Math.max(
        1, existing?.sessions_per_week ?? 0, new Set(combined.map((session) => session.placementId)).size,
      )),
    }
    if (!existing) {
      if (!recordPayment) throw new Error("The recorded family payment could not be found")
      const { data, error: insertError } = await supabase.from("payment_entitlements").insert({
        parent_lead_id: parentLeadId,
        period_start: periodStart,
        period_end: periodEnd,
        received_at: receivedOn ? `${receivedOn}T12:00:00Z` : undefined,
        recorded_by: userId,
        note,
        ...paymentChanges,
        ...exactChanges,
      }).select("id").single()
      if (data && !insertError) return data
      if (insertError?.code === "23505") continue
      throw new Error("The family payment could not be recorded")
    }

    // Payment writes for two siblings can share the same family row. Retry against
    // the latest snapshot instead of overwriting a sibling or its existing receipt.
    const { data, error: updateError } = await supabase.from("payment_entitlements")
      .update(recordPayment ? { ...paymentChanges, ...exactChanges } : exactChanges)
      .eq("id", existing.id)
      .eq("session_revision", existing.session_revision)
      .select("id")
      .maybeSingle()
    if (updateError) throw new Error("The family payment could not be updated")
    if (data) return data
  }
  throw new Error("The family payment changed while saving. Refresh and retry.")
}
