import "server-only"

import type { supabaseService } from "@/lib/supabase/service"

export async function withFamilyBookingLock<T>(
  supabase: ReturnType<typeof supabaseService>,
  parentLeadId: string,
  work: () => Promise<T>,
): Promise<T> {
  const now = new Date()
  const until = new Date(now.getTime() + 20 * 60 * 1000).toISOString()
  const { data, error } = await supabase.from("parent_leads")
    .update({ family_booking_operation_until: until })
    .eq("id", parentLeadId)
    .or(`family_booking_operation_until.is.null,family_booking_operation_until.lt.${now.toISOString()}`)
    .select("id").maybeSingle()
  if (error) throw new Error("Could not lock the family booking")
  if (!data) throw new Error("Another family booking action is in progress. Refresh and retry.")
  try {
    return await work()
  } finally {
    const { error: unlockError } = await supabase.from("parent_leads")
      .update({ family_booking_operation_until: null })
      .eq("id", parentLeadId)
      .eq("family_booking_operation_until", until)
    if (unlockError) console.error("Could not clear the family booking lock", unlockError.code)
  }
}
