"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { assertCapability } from "@/lib/auth/require-capability"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function addMarketingPartner(formData: FormData) {
  await assertCapability("manage_setup")
  const name = z.string().trim().min(1).max(90).safeParse(formData.get("name"))
  if (!name.success) throw new Error("Enter a partner name of up to 90 characters.")

  const { error } = await supabaseAdmin.from("academy_marketing_partners").insert({ name: name.data })
  if (error?.code === "23505") throw new Error("This partner already exists. Check the active and hidden lists.")
  if (error) throw new Error("Could not add the partner.")
  revalidatePath("/admin/setup")
}

export async function setMarketingPartnerActive(formData: FormData) {
  await assertCapability("manage_setup")
  const input = z.object({ id: z.uuid(), active: z.enum(["true", "false"]) }).safeParse({
    id: formData.get("id"),
    active: formData.get("active"),
  })
  if (!input.success) throw new Error("Invalid partner selection.")

  const { data, error } = await supabaseAdmin.from("academy_marketing_partners")
    .update({ active: input.data.active === "true" })
    .eq("id", input.data.id)
    .select("id")
    .maybeSingle()
  if (error || !data) throw new Error("Could not update the partner.")
  revalidatePath("/admin/setup")
}
