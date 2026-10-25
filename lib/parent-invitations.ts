import { getResend, emailFrom } from "@/lib/resend"
import { supabaseService } from "@/lib/supabase/service"
import { getRequestOrigin } from "@/lib/site-url"

export async function sendPaymentConfirmedInvitation(input: {
  parentLeadId: string
  actorId: string
}) {
  const supabase = supabaseService()
  const { data: parent, error: parentError } = await supabase
    .from("parent_leads")
    .select("parent_name,email")
    .eq("id", input.parentLeadId)
    .single()
  if (parentError || !parent) throw new Error("Could not load the parent account")

  const idempotencyKey = `payment-confirmed-${input.parentLeadId}`
  const { data: previous } = await supabase
    .from("email_delivery_log")
    .select("id,status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle()
  if (previous?.status === "sent") return

  const siteUrl = await getRequestOrigin()
  let link = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: parent.email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/parent` },
  })

  if (link.error) {
    const { error: createUserError } = await supabase.auth.admin.createUser({
      email: parent.email,
      email_confirm: true,
    })
    if (createUserError && !/already/i.test(createUserError.message)) {
      throw new Error("Could not prepare the parent account")
    }
    link = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: parent.email,
      options: { redirectTo: `${siteUrl}/auth/callback?next=/parent` },
    })
  }
  if (link.error || !link.data?.properties?.action_link) {
    throw new Error("Could not create the secure sign-in link")
  }

  const { data: access } = await supabase
    .from("parent_portal_access")
    .select("id")
    .eq("parent_lead_id", input.parentLeadId)
    .ilike("email", parent.email)
    .maybeSingle()

  if (access) {
    await supabase.from("parent_portal_access").update({
      status: "invited", invited_at: new Date().toISOString(), invited_by: input.actorId,
    }).eq("id", access.id)
  } else {
    await supabase.from("parent_portal_access").insert({
      parent_lead_id: input.parentLeadId, email: parent.email.toLowerCase(),
      status: "invited", invited_by: input.actorId,
    })
  }

  const html = `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#20304a"><p>Hello ${parent.parent_name},</p><h1 style="color:#5170ff">Your TAA place is confirmed</h1><p>We have confirmed your payment and your place is now active.</p><p><a href="${link.data.properties.action_link}" style="display:inline-block;background:#ff5757;color:white;padding:14px 20px;border-radius:8px;text-decoration:none">Open your TAA parent account</a></p><p>For your security, this is a one-time sign-in link. It gives you access only to your family’s TAA information.</p><p>Warmly,<br/>The Afternoon Academy</p></main>`
  const { data: log } = previous
    ? { data: previous }
    : await supabase.from("email_delivery_log").insert({
        parent_lead_id: input.parentLeadId, email_kind: "payment_confirmed",
        recipient_email: parent.email, idempotency_key: idempotencyKey,
        created_by: input.actorId,
      }).select("id").single()

  const { data, error } = await getResend().emails.send({
    from: emailFrom, to: [parent.email], subject: "Your TAA place is confirmed",
    html, text: `Hello ${parent.parent_name}, your TAA place is confirmed. Sign in securely: ${link.data.properties.action_link}`,
  }, { headers: { "Idempotency-Key": idempotencyKey } })
  if (error) {
    await supabase.from("email_delivery_log").update({ status: "failed", error_message: error.message.slice(0, 500) }).eq("id", log?.id || "")
    throw new Error("Payment was recorded, but the parent sign-in email could not be sent")
  }
  await supabase.from("email_delivery_log").update({ status: "sent", resend_email_id: data?.id || null, sent_at: new Date().toISOString() }).eq("id", log?.id || "")
}
