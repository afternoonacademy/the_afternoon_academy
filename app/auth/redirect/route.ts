import { NextResponse } from "next/server"

import { requireUser } from "@/lib/auth/require-user"
import { supabaseService } from "@/lib/supabase/service"

export async function GET(request: Request) {
  const url = new URL(request.url)

  try {
    const { user } = await requireUser()

    const supabaseAdmin = supabaseService()

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, auth_user_id, email, name, role")
      .eq("auth_user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("User lookup failed:", error)
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }

    let internalUser = data

    if (!internalUser) {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          auth_user_id: user.id,
          email: user.email?.toLowerCase(),
          name: user.user_metadata?.name || user.email?.split("@")[0],
          role: "parent",
        })
        .select("id, auth_user_id, email, name, role")
        .single()

      if (insertError || !newUser) {
        console.error("User creation failed:", insertError)
        return NextResponse.redirect(new URL("/unauthorised", url.origin))
      }

      internalUser = newUser
    }

    if (internalUser.role === "admin") {
      return NextResponse.redirect(new URL("/admin", url.origin))
    }

    return NextResponse.redirect(new URL("/", url.origin))
  } catch (err) {
    console.error("Redirect route error:", err)
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }
}
