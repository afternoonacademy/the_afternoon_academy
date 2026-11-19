"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import { supabaseService } from "@/lib/supabase/service"

const moveSlotSchema = z.object({
  caseId: z.string().uuid(),
  parentLeadId: z.string().uuid(),
  placementId: z.string().uuid(),
  templateId: z.string().uuid(),
  effectiveDate: z.string().date(),
  offerRevision: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().max(2147483647)),
})

export async function moveRenewalRecurringSlot(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = moveSlotSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error("Choose the new weekday slot and the first date to move.")

  const { caseId, parentLeadId, placementId, templateId, effectiveDate, offerRevision } = parsed.data
  const { error } = await supabaseService().rpc("move_renewal_recurring_slot", {
    p_case_id: caseId,
    p_parent_id: parentLeadId,
    p_placement_id: placementId,
    p_template_id: templateId,
    p_effective_date: effectiveDate,
    p_offer_revision: offerRevision,
    p_actor_id: user.id,
  })
  if (error?.code === "P0001") throw new Error(error.message)
  if (error?.code === "23505" || error?.code === "55P03" || error?.code === "40P01") {
    throw new Error("The slot is being updated or was just taken. Refresh and try again.")
  }
  if (error) throw new Error("The recurring slot could not be changed.")

  revalidatePath("/admin", "layout")
}
