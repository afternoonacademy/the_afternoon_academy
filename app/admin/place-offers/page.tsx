import { PlaceOfferForm } from "@/components/admin/place-offer-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseAdmin } from "@/lib/supabase/admin"

export default async function PlaceOffersPage() {
  const [{ data: families }, { data: children }, { data: slots }, { data: offers }] = await Promise.all([
    supabaseAdmin.from("parent_leads").select("id,parent_name,email").neq("status", "closed").order("created_at", { ascending: false }),
    supabaseAdmin.from("child_leads").select("id,parent_lead_id,first_name,school_year").order("created_at"),
    supabaseAdmin.from("weekly_table_templates").select("id,weekday,table_number,academy_table_id,starts_at,duration_minutes").eq("status", "active").order("weekday").order("starts_at"),
    supabaseAdmin.from("place_offers").select("id,status,payment_reference,expires_at,created_at,parent_leads(parent_name),child_leads(first_name)").in("status", ["draft","sent","viewed","accepted"]).order("created_at", { ascending: false }),
  ])

  return <div className="space-y-8">
    <div><h2 className="text-3xl font-bold tracking-tight">Place offers</h2><p className="text-muted-foreground">Send a precise, time-limited bank-transfer offer. Payment is always confirmed manually.</p></div>
    <Card><CardHeader><CardTitle>Create and send an offer</CardTitle></CardHeader><CardContent><PlaceOfferForm families={families || []} childOptions={children || []} slots={slots || []} /></CardContent></Card>
    <Card><CardHeader><CardTitle>Current held offers</CardTitle></CardHeader><CardContent>{offers?.length ? <div className="space-y-3">{offers.map((offer) => <div className="rounded-lg border p-4" key={offer.id}><div className="font-medium">{offer.child_leads?.[0]?.first_name || "Child"} · {offer.parent_leads?.[0]?.parent_name || "Parent"}</div><div className="mt-1 text-sm text-muted-foreground">Reference {offer.payment_reference} · {offer.status.replaceAll("_"," ")} · expires {new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short"}).format(new Date(offer.expires_at))}</div></div>)}</div> : <p className="text-sm text-muted-foreground">No places are currently held by an offer.</p>}</CardContent></Card>
  </div>
}
