import { NextResponse } from "next/server"

import { supabaseService } from "@/lib/supabase/service"
import { supabaseAuthServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)

  const supabase = await supabaseAuthServer()
  const code = url.searchParams.get("code")

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Auth exchange failed:", error)
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }

  const email = user.email.toLowerCase()
  const name =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    email.split("@")[0]

  const supabaseAdmin = supabaseService()

  const { data: existingProfile, error: profileFetchError } =
    await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle()

  if (profileFetchError) {
    console.error("Profile fetch failed:", profileFetchError)
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }

  let appRole = existingProfile?.role || "parent"

  if (!existingProfile) {
    const { error: insertProfileError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_user_id: user.id,
        email,
        name,
        role: "parent",
      })

    if (insertProfileError) {
      console.error("Profile insert failed:", insertProfileError)
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }

    appRole = "parent"
  }

  const { data: existingRole, error: roleFetchError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", appRole)
    .maybeSingle()

  if (roleFetchError) {
    console.error("Role fetch failed:", roleFetchError)
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }

  if (!existingRole) {
    const { error: insertRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: appRole,
      })

    if (insertRoleError) {
      console.error("Role insert failed:", insertRoleError)
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }
  }

  const requestedNext = url.searchParams.get("next")
  const fallbackRoute = appRole === "admin" ? "/admin" : "/"

  const safeNext =
    requestedNext &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : fallbackRoute

  return NextResponse.redirect(new URL(safeNext, url.origin))
}
