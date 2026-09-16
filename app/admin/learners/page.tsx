import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LearnersPage() {
  const { data: learners, error } = await supabaseAdmin.from("learners").select("id, first_name, year_group, status, created_at").order("created_at", { ascending: false })
  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-3xl font-bold tracking-tight">Learners</h2><p className="text-muted-foreground">A concise, human-led record for every child you support.</p></div><Link href="/admin/learners/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add learner</Link></div>
    {error ? <p className="rounded-lg border p-6">Could not load learners: {error.message}</p> : null}
    {!error && !learners?.length ? <Card><CardContent className="p-6 text-muted-foreground">No learner records yet. Add a learner once a family has confirmed they would like to begin.</CardContent></Card> : null}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{learners?.map((learner) => <Link key={learner.id} href={`/admin/learners/${learner.id}`}><Card className="h-full transition-colors hover:bg-muted/50"><CardHeader><CardTitle>{learner.first_name}</CardTitle></CardHeader><CardContent className="space-y-1 text-sm text-muted-foreground"><p>{learner.year_group || "Year group not recorded"}</p><p className="capitalize">{learner.status}</p></CardContent></Card></Link>)}</div>
  </div>
}