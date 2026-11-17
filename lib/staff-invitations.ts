import "server-only"

import { supabaseService } from "@/lib/supabase/service"
import { getResend, emailFrom } from "@/lib/resend"

export const staffRequestMessage = "If this email has approved staff access, a sign-in link will arrive shortly. Check your inbox and spam folder. You can try again after one minute or contact an Academy Admin."

export function staffSiteOrigin() {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.theafternoonacademy.com")
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid staff email origin")
  return url.origin
}

export async function requestStaffLink(email: string) {
  const db = supabaseService()
  const { data: invitationId, error } = await db.rpc("reserve_staff_signin", { p_email: email })
  if (error || !invitationId) return
  let delivered = false
  try {
    // Generate does not send email or provision application permissions.
    let link = await db.auth.admin.generateLink({ type: "invite", email })
    if (link.error) link = await db.auth.admin.generateLink({ type: "magiclink", email })
    const properties = link.data?.properties
    const type = properties?.verification_type
    if (link.error || !properties?.hashed_token || !["invite", "magiclink"].includes(type || "")) throw new Error("Link unavailable")
    // Fragments never reach server access logs. The confirmation page removes this
    // fragment before the explicit user POST; no automatic token consumption on GET.
    const target = `${staffSiteOrigin()}/auth/confirm#${new URLSearchParams({ token_hash: properties.hashed_token, type: type! })}`
    const { error: sendError } = await getResend().emails.send({
      from: emailFrom, to: [email], subject: "Your Afternoon Academy staff sign-in link",
      text: `Your Academy staff sign-in link: ${target}\nOpen the link and select Continue to sign in. This one-time link expires shortly. If you did not request it, ignore this email.`,
      html: `<p>Your Academy staff sign-in link is ready.</p><p><a href="${target.replaceAll("&", "&amp;")}">Open staff sign-in</a></p><p>Select Continue to sign in. This one-time link expires shortly. If you did not request it, ignore this email.</p>`,
    })
    delivered = !sendError
  } catch {
    // Never log auth tokens, provider payloads, or account enumeration details.
  }
  await db.from("staff_invitations").update({ delivery_status: delivered ? "sent" : "failed" }).eq("id", invitationId)
}

export async function claimStaffInvitation(userId: string) {
  const { data, error } = await supabaseService().rpc("complete_staff_invitation", { p_user_id: userId })
  if (error) throw new Error("Staff access could not be checked")
  return data === "admin" || data === "teacher" ? data as "admin" | "teacher" : null
}
