import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth/require-user"
import { supabaseService } from "@/lib/supabase/service"

export async function requireAdmin() {
  const { user } = await requireUser()

  const supabaseAdmin = supabaseService()

  const { data: internalUser, error } = await supabaseAdmin
    .from("users")
    .select("id, auth_user_id, email, name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("Admin lookup failed:", error)
    redirect("/sign-in")
  }

  if (!internalUser || internalUser.role !== "admin") {
    redirect("/unauthorised")
  }

  return {
    user,
    internalUser,
  }
}
