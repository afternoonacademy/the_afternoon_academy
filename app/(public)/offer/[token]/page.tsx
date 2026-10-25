import { notFound } from "next/navigation"
import { AcceptOfferButton } from "@/components/public/accept-offer-button"
import { supabaseService } from "@/lib/supabase/service"
import { createHash } from "node:crypto"

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

export default async function OfferPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data: offer } = await supabaseService().from("place_offers").select("status,weekday,table_number,starts_at,amount_cents,currency,service_period_start,service_period_end,expires_at,child_leads(first_name)").eq("access_token_hash", hashToken(token)).maybeSingle()
  if (!offer || !["sent","viewed"].includes(offer.status) || new Date(offer.expires_at) < new Date()) notFound()

  const money = new Intl.NumberFormat("en-GB",{style:"currency",currency:offer.currency}).format(offer.amount_cents / 100)
  const date = (value: string) => new Intl.DateTimeFormat("en-GB",{dateStyle:"long"}).format(new Date(value+"T12:00:00Z"))
  const childName = offer.child_leads?.[0]?.first_name || "your child"
  return <main className="mx-auto flex min-h-svh max-w-2xl items-center p-6"><section className="w-full rounded-2xl border bg-background p-6 shadow-sm md:p-10"><p className="text-sm font-medium text-[#5170ff]">The Afternoon Academy</p><h1 className="mt-2 text-3xl font-bold">Your place offer</h1><p className="mt-4 text-muted-foreground">We are pleased to offer {childName} a place with TAA.</p><dl className="mt-6 grid gap-4 rounded-xl bg-muted/50 p-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Session</dt><dd className="font-semibold">{days[offer.weekday]} at {offer.starts_at.slice(0,5)}</dd></div><div><dt className="text-sm text-muted-foreground">Table</dt><dd className="font-semibold">TAA1 Table {offer.table_number}</dd></div><div><dt className="text-sm text-muted-foreground">Service period</dt><dd className="font-semibold">{date(offer.service_period_start)} – {date(offer.service_period_end)}</dd></div><div><dt className="text-sm text-muted-foreground">Total</dt><dd className="font-semibold">{money}</dd></div></dl><p className="mt-6 text-sm text-muted-foreground">Please make your bank transfer using the unique reference in the email. Once we confirm payment, we will send a secure sign-in link for your parent account.</p><div className="mt-6"><AcceptOfferButton token={token} /></div></section></main>
}
