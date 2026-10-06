import { redirect } from "next/navigation"

import { roleHasCapability } from "@/lib/auth/capabilities.mjs"
import { requireUser } from "@/lib/auth/require-user"
import { supabaseService } from "@/lib/supabase/service"

async function loadInternalUser() {
  const { user } = await requireUser()
  const supabase = supabaseService()
  const { data: internalUser, error } = await supabase
    .from("users")
    .select("id,auth_user_id,email,name,role")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("Internal user lookup failed:", error)
    return { user, internalUser: null }
  }

  return { user, internalUser }
}

export async function requireCapability(capability: string) {
  const context = await loadInternalUser()
  if (!context.internalUser) redirect("/unauthorised")
  if (!roleHasCapability(context.internalUser.role, capability)) {
    redirect("/unauthorised")
  }
  return { user: context.user, internalUser: context.internalUser }
}

export async function assertCapability(capability: string) {
  const context = await loadInternalUser()
  if (!context.internalUser || !roleHasCapability(context.internalUser.role, capability)) {
    throw new Error("You do not have permission to perform this action")
  }
  return { user: context.user, internalUser: context.internalUser }
}
