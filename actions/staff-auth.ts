"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/require-admin"
import { supabaseService } from "@/lib/supabase/service"
import { supabaseAuthServer } from "@/lib/supabase/server"
import { claimStaffInvitation, requestStaffLink, staffRequestMessage } from "@/lib/staff-invitations"

export async function requestStaffSignIn(_previous: string, form: FormData) {
  const parsed = z.email().max(254).safeParse(String(form.get("email") || "").trim().toLowerCase())
  if (parsed.success) {
    try { await requestStaffLink(parsed.data) } catch { /* Same response on provider/database failure. */ }
  }
  return staffRequestMessage
}

export async function confirmStaffSignIn(_previous: string, form: FormData) {
  const token = String(form.get("token_hash") || "")
  const type = form.get("type")
  if (!/^[a-f0-9]{32,256}$/i.test(token) || (type !== "invite" && type !== "magiclink")) return "This link is invalid. Request a new staff sign-in link."
  const supabase = await supabaseAuthServer()
  const { error } = await supabase.auth.verifyOtp({ token_hash: token, type })
  if (error) return "This link has expired or was already used. Request a new staff sign-in link."
  const { data: { user } } = await supabase.auth.getUser()
  try {
    if (user && await claimStaffInvitation(user.id)) return "signed-in"
  } catch { /* Deny without serializing provider/account details. */ }
  await supabase.auth.signOut()
  return "Staff access is unavailable. Contact an Academy Admin or request a new link."
}

export async function approveStaffInvitation(form: FormData) {
  const { user } = await requireAdmin()
  const email = z.email().max(254).parse(String(form.get("email") || "").trim().toLowerCase())
  const role = z.enum(["admin", "teacher"]).parse(form.get("role"))
  const name = z.string().trim().max(120).parse(String(form.get("name") || ""))
  const db = supabaseService()
  const { data: existing, error: lookupError } = await db.from("staff_invitations").select("id,status").eq("email", email).maybeSingle()
  if (lookupError) throw new Error("Could not check staff invitation")
  if (existing?.status === "accepted") throw new Error("This invitation has been accepted. Manage existing account permissions separately.")
  const values = { email, name: name || null, role, status: "approved", approved_by: user.id, approval_source: "admin", revoked_by: null, revoked_at: null, approved_at: new Date().toISOString(), expires_at: new Date(Date.now()+7*86400000).toISOString() }
  const result = existing
    ? await db.from("staff_invitations").update(values).eq("id", existing.id).neq("status", "accepted").select("id").maybeSingle()
    : await db.from("staff_invitations").insert(values).select("id").single()
  if (result.error || !result.data) throw new Error("Could not approve this invitation; refresh and try again")
  revalidatePath("/admin/setup")
}

export async function withdrawStaffInvitation(form: FormData) {
  const { user } = await requireAdmin()
  const id = z.uuid().parse(form.get("id"))
  const { data, error } = await supabaseService().from("staff_invitations").update({ status: "revoked", revoked_by: user.id, revoked_at: new Date().toISOString() }).eq("id", id).eq("status", "approved").select("id").maybeSingle()
  if (error || !data) throw new Error("Only pending invitations can be withdrawn")
  revalidatePath("/admin/setup")
}
