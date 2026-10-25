"use server"

import { redirect } from "next/navigation"

import { supabaseAuthServer } from "@/lib/supabase/server"

export async function logout() {
  const supabase = await supabaseAuthServer()

  await supabase.auth.signOut()

  redirect("/sign-in")
}
