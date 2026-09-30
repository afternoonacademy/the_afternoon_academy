import { NextResponse } from "next/server"

import { supabaseService } from "@/lib/supabase/service"
import { supabaseAuthServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const supabase = await supabaseAuthServer()
  const code = url.searchParams.get("code")

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(new URL("/sign-in", url.origin))
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.redirect(new URL("/sign-in", url.origin))

  const email = user.email.toLowerCase()
  const name = user.user_metadata?.name || user.user_metadata?.full_name || email.split("@")[0]
  const admin = supabaseService()
  const { data: profile } = await admin.from("users").select("id,role").eq("auth_user_id", user.id).maybeSingle()

  if (!profile) {
    const { data: invitation } = await admin
      .from("parent_portal_access")
      .select("id")
      .ilike("email", email)
      .in("status", ["invited","active"])
      .maybeSingle()

    if (!invitation) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/sign-in?error=invitation-required", url.origin))
    }

    const { error: profileError } = await admin.from("users").insert({
      auth_user_id: user.id, email, name, role: "parent",
    })
    if (profileError) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }
    const { error: roleError } = await admin.from("user_roles").insert({ user_id: user.id, role: "parent" })
    if (roleError) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }
    await admin.from("parent_portal_access").update({
      auth_user_id: user.id, status: "active", activated_at: new Date().toISOString(),
    }).ilike("email", email).in("status", ["invited","active"])
  } else if (profile.role === "parent") {
    await admin.from("parent_portal_access").update({
      auth_user_id: user.id, status: "active", activated_at: new Date().toISOString(),
    }).ilike("email", email).eq("status", "invited")
  }

  const requestedNext = url.searchParams.get("next")
  const fallbackRoute = profile?.role === "admin" ? "/admin" : "/parent"
  const safeNext = requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : fallbackRoute

  return NextResponse.redirect(new URL(safeNext, url.origin))
}
