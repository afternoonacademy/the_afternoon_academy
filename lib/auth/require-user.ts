import { redirect } from "next/navigation"

import { supabaseAuthServer } from "@/lib/supabase/server"

export async function requireUser() {
  const supabase = await supabaseAuthServer()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/sign-in")
  }

  return { user }
}
