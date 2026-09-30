import { redirect } from "next/navigation"

import { supabaseAuthServer } from "@/lib/supabase/server"

export default async function ParentPage() {
  const supabase = await supabaseAuthServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/parent")

  const { data: learners } = await supabase
    .from("learners")
    .select("id,first_name,year_group,status")
    .order("first_name")

  const learnerIds = (learners || []).map((learner) => learner.id)
  const { data: updates } = learnerIds.length
    ? await supabase.from("teacher_updates").select("id,learner_id,occurred_on,what_happened,why_it_mattered,next_step").in("learner_id", learnerIds).order("occurred_on",{ascending:false}).limit(12)
    : { data: [] as Array<{id:string;learner_id:string;occurred_on:string;what_happened:string;why_it_mattered:string;next_step:string}> }

  const byLearner = new Map((learners || []).map((learner) => [learner.id, learner.first_name]))
  return <main className="mx-auto min-h-svh max-w-4xl p-6 md:p-10"><header><p className="text-sm font-medium text-[#5170ff]">The Afternoon Academy</p><h1 className="mt-2 text-3xl font-bold">Your family’s TAA space</h1><p className="mt-2 text-muted-foreground">A calm, human view of what is happening and what comes next.</p></header><section className="mt-8"><h2 className="text-xl font-semibold">Your children</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{learners?.length ? learners.map((learner) => <article className="rounded-xl border p-5" key={learner.id}><h3 className="font-semibold">{learner.first_name}</h3><p className="text-sm text-muted-foreground">{learner.year_group || "TAA learner"} · {learner.status}</p></article>) : <p className="text-muted-foreground">Your account is being prepared. Please contact TAA if this remains visible.</p>}</div></section><section className="mt-10"><h2 className="text-xl font-semibold">Recent learning updates</h2><p className="mt-1 text-sm text-muted-foreground">Updates are shared by TAA’s team once they are ready for your family.</p><div className="mt-3 space-y-4">{updates?.length ? updates.map((update) => <article className="rounded-xl border p-5" key={update.id}><p className="text-sm font-medium text-[#5170ff]">{byLearner.get(update.learner_id) || "Learner"} · {new Intl.DateTimeFormat("en-GB",{dateStyle:"medium"}).format(new Date(update.occurred_on+"T12:00:00Z"))}</p><h3 className="mt-3 font-semibold">What happened</h3><p className="mt-1">{update.what_happened}</p><h3 className="mt-3 font-semibold">Why it mattered</h3><p className="mt-1">{update.why_it_mattered}</p><h3 className="mt-3 font-semibold">Next small step</h3><p className="mt-1">{update.next_step}</p></article>) : <p className="rounded-xl border p-5 text-muted-foreground">There are no learning updates to share yet. We will add them as they are reviewed by the TAA team.</p>}</div></section></main>
}
