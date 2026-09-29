import { NextResponse } from "next/server"
import { generateText, gateway, Output } from "ai"
import { z } from "zod"
import { supabaseAuthServer } from "@/lib/supabase/server"
import { supabaseService } from "@/lib/supabase/service"

const schema = z.object({ learnerId: z.string().uuid(), month: z.string().regex(/^\d{4}-\d{2}$/) })
export async function POST(request: Request) {
  const auth = await supabaseAuthServer(); const { data: { user } } = await auth.auth.getUser(); if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 })
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Choose a learner and month" }, { status: 400 })
  const supabase = supabaseService(); const start = `${parsed.data.month}-01`; const end = new Date(`${start}T12:00:00Z`); end.setUTCMonth(end.getUTCMonth() + 1); const endDate = end.toISOString().slice(0, 10)
  const [{ data: learner }, { data: notes }] = await Promise.all([supabase.from("learners").select("first_name,parent_lead_id,parent_leads(parent_name,email)").eq("id", parsed.data.learnerId).single(), supabase.from("teacher_updates").select("occurred_on,what_happened,why_it_mattered,next_step").eq("learner_id", parsed.data.learnerId).gte("occurred_on", start).lt("occurred_on", endDate).order("occurred_on")])
  if (!learner) return NextResponse.json({ error: "Learner not found" }, { status: 404 }); if (!notes?.length) return NextResponse.json({ error: "There are no internal session notes for this month." }, { status: 400 })
  const parent = Array.isArray(learner.parent_leads) ? learner.parent_leads[0] : learner.parent_leads
  const evidence = notes.map((note) => `${note.occurred_on}: ${note.what_happened} | ${note.why_it_mattered} | Next: ${note.next_step}`).join("\n")
  try { const { output } = await generateText({ model: gateway("openai/gpt-6-sol"), providerOptions: { gateway: { user: user.id, tags: ["feature:family-summary"] } }, output: Output.object({ schema: z.object({ subject: z.string().max(140), email: z.string().max(5000), internalPlan: z.string().max(2500) }) }), instructions: "Draft a warm, concise monthly update for a learner's parent from verified teacher notes. Do not diagnose, invent facts, exaggerate, or expose internal staff-only observations. Include progress, a constructive next step, and invite the family to reply. Separately create a short internal actionable plan for teachers.", prompt: `Learner: ${learner.first_name}. Parent: ${parent?.parent_name || "Parent"}. Month: ${parsed.data.month}. Internal evidence:\n${evidence}` }); return NextResponse.json({ ...output, recipient: parent?.email || "" }) } catch { return NextResponse.json({ error: "AI summary is unavailable. Check AI Gateway is enabled in Vercel." }, { status: 502 }) }
}
