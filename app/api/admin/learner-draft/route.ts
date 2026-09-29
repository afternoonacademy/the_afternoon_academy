import { NextResponse } from "next/server"
import { generateText, gateway, Output } from "ai"
import { z } from "zod"

import { supabaseAuthServer } from "@/lib/supabase/server"
import { supabaseService } from "@/lib/supabase/service"

const bodySchema = z.object({ observation: z.string().trim().min(12).max(2000) })

export async function POST(request: Request) {
  const auth = await supabaseAuthServer(); const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 })
  const { data: member } = await supabaseService().from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
  if (member?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  const parsed = bodySchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Write a slightly fuller factual observation first." }, { status: 400 })
  if (!process.env.AI_GATEWAY_API_KEY) return NextResponse.json({ error: "AI drafting is not configured yet." }, { status: 503 })
  try {
    const { output } = await generateText({ model: gateway("openai/gpt-6-sol"), output: Output.object({ schema: z.object({ whatHappened: z.string().max(800), whyItMattered: z.string().max(800), nextStep: z.string().max(800), suggestedGoal: z.string().max(300).optional() }) }), instructions: "You help an education team turn one factual observation into a concise teacher update. Do not diagnose, infer protected characteristics, use clinical language, make predictions, or invent facts. Preserve uncertainty. Return calm, evidence-based British English. The teacher must review before saving.", prompt: `Teacher observation:\n${parsed.data.observation}` })
    return NextResponse.json(output)
  } catch { return NextResponse.json({ error: "Drafting is temporarily unavailable. Your observation has not been saved." }, { status: 502 }) }
}
