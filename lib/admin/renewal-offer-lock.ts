import "server-only"

import type { supabaseService } from "@/lib/supabase/service"

// Keep competing plan, send, payment and release actions from operating on
// different versions. The lease exceeds the hosted request limit and expires
// if the request is terminated before its finally block can run.
export async function withRenewalOfferLock<T>(
  supabase: ReturnType<typeof supabaseService>,
  renewal: { id: string; updated_at: string },
  work: () => Promise<T>,
) {
  const now = new Date()
  const until = new Date(now.getTime() + 20 * 60 * 1000).toISOString()
  const { data, error } = await supabase.from("renewal_cases")
    .update({ offer_operation_until: until })
    .eq("id", renewal.id)
    .eq("updated_at", renewal.updated_at)
    .or(`offer_operation_until.is.null,offer_operation_until.lt.${now.toISOString()}`)
    .select("id").maybeSingle()

  if (error) throw new Error("Could not lock the renewal for this action")
  if (!data) throw new Error("This renewal changed or another action is in progress. Refresh and try again.")

  try {
    return await work()
  } finally {
    const { error: unlockError } = await supabase.from("renewal_cases")
      .update({ offer_operation_until: null })
      .eq("id", renewal.id)
      .eq("offer_operation_until", until)
    if (unlockError) console.error("Renewal offer lock could not be cleared", unlockError.code)
  }
}
