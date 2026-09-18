import { addBuilding, addRoom } from "@/actions/academy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabaseAdmin } from "@/lib/supabase/admin"

export default async function AcademySetupPage() {
 const [{data:buildings},{data:rooms},{data:tables}] = await Promise.all([
  supabaseAdmin.from("academy_buildings").select("id,name,address").eq("status","active").order("name"),
  supabaseAdmin.from("academy_rooms").select("id,building_id,name,room_type,capacity").eq("status","active").order("name"),
  supabaseAdmin.from("academy_tables").select("room_id,name,seat_capacity").eq("status","active").order("table_number"),
 ])
 return <div className="space-y-6 pb-10"><div className="brand-hero p-6"><p className="brand-kicker">Academy setup</p><h2 className="mt-2 text-3xl font-bold">Your places and rooms</h2><p className="mt-2 text-muted-foreground">Configure the physical Academy once; bookable sessions build from this foundation.</p></div>
 <div className="grid gap-4 lg:grid-cols-2"><section className="brand-card p-5"><h3 className="font-semibold">Add building</h3><form action={addBuilding} className="mt-3 flex gap-2"><Input name="name" placeholder="Building name" required/><Button>Add building</Button></form></section>
 <section className="brand-card p-5"><h3 className="font-semibold">Add room</h3><form action={addRoom} className="mt-3 grid gap-2 sm:grid-cols-2"><select className="h-10 rounded-md border bg-background px-3" name="buildingId" required><option value="">Building</option>{(buildings||[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><Input name="name" placeholder="Room name" required/><select className="h-10 rounded-md border bg-background px-3" name="roomType"><option value="group">Group room</option><option value="tutor">Tutor room</option><option value="other">Other</option></select><Input name="capacity" defaultValue="6" min="1" type="number" required/><Button className="sm:col-span-2">Add room</Button></form></section></div>
 <section className="grid gap-4 md:grid-cols-2">{(buildings||[]).map(b=><div className="brand-card p-5" key={b.id}><h3 className="text-xl font-bold">{b.name}</h3><div className="mt-4 space-y-3">{(rooms||[]).filter(r=>r.building_id===b.id).map(r=><div className="rounded-xl bg-muted/60 p-4" key={r.id}><p className="font-semibold">{r.name}</p><p className="text-sm text-muted-foreground">{r.room_type} · capacity {r.capacity||"not set"}</p>{(tables||[]).filter(t=>t.room_id===r.id).map(t=><span className="mr-2 mt-2 inline-block rounded-full bg-accent px-3 py-1 text-xs" key={t.name}>{t.name} · {t.seat_capacity} seats</span>)}</div>)}</div></div>)}</section></div>
}