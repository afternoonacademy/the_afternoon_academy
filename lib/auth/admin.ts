import { redirect } from "next/navigation"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function getCurrentAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    return null
  }

  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("id, user_id, email, role")
    .eq("user_id", user.id)
    .single()

  if (adminError || !adminUser) {
    return null
  }

  return {
    user,
    adminUser,
  }
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect("/auth/login")
  }

  return admin
}