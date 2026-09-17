"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/require-admin"
import { supabaseService } from "@/lib/supabase/service"

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
