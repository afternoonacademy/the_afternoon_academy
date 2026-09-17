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

const manualLeadSchema = z.object({
  parentName: z.string().trim().min(2).max(160), email: z.string().trim().email().max(254), phone: z.string().trim().max(50).optional(),
  childFirstName: z.string().trim().min(1).max(80), childAge: z.coerce.number().int().min(4).max(18), schoolYear: z.string().trim().max(80).optional(),
  source: z.string().trim().min(2).max(80),
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

export async function createManualLead(formData: FormData) {
  await requireAdmin()
  const parsed = manualLeadSchema.safeParse({ parentName: formData.get("parentName"), email: formData.get("email"), phone: formData.get("phone") || undefined, childFirstName: formData.get("childFirstName"), childAge: formData.get("childAge"), schoolYear: formData.get("schoolYear") || undefined, source: formData.get("source") })
  if (!parsed.success) throw new Error("Please check the lead details")
  const data = parsed.data; const supabase = supabaseService()
  const { data: lead, error: leadError } = await supabase.from("parent_leads").insert({ parent_name: data.parentName, email: data.email, phone: data.phone || null, interest_level: "interested_timetable", consent_contact: true, source: data.source, status: "new" }).select("id").single()
  if (leadError || !lead) throw new Error("Could not create parent lead")
  const { data: child, error: childError } = await supabase.from("child_leads").insert({ parent_lead_id: lead.id, first_name: data.childFirstName, child_age: data.childAge, school_year: data.schoolYear || null, curriculum: "other_not_sure", support_needs: [] }).select("id").single()
  if (childError || !child) throw new Error("Could not create child lead")
  const { error: timetableError } = await supabase.from("timetable_preferences").insert({ child_lead_id: child.id, preferred_days: [], preferred_times: [] })
  if (timetableError) throw new Error("Could not create timetable preference")
  revalidatePath("/admin/leads"); revalidatePath("/admin"); revalidatePath("/admin/sessions")
}
