import { NextResponse } from "next/server"
import { generateText, gateway, Output } from "ai"
import { z } from "zod"

import { roleHasCapability } from "@/lib/auth/capabilities.mjs"
import { buildMonthlyFamilyEvidence } from "@/lib/teaching/family-summary-evidence.mjs"
import { supabaseAuthServer } from "@/lib/supabase/server"
import { supabaseService } from "@/lib/supabase/service"

const schema = z.object({
  learnerId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  mode: z.enum(["preview", "draft"]).default("draft"),
})

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

function monthRange(month: string) {
  const start = `${month}-01`
  const end = new Date(`${start}T12:00:00Z`)
  end.setUTCMonth(end.getUTCMonth() + 1)
  return { start, endDate: end.toISOString().slice(0, 10) }
}

export async function POST(request: Request) {
  const auth = await supabaseAuthServer()
  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 })
  }

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a learner and month" },
      { status: 400 },
    )
  }

  const supabase = supabaseService()
  const { data: member } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (!member || !roleHasCapability(member.role, "view_family_updates")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { start, endDate } = monthRange(parsed.data.month)

  const [
    learnerResult,
    notesResult,
    goalsResult,
    goalProgressResult,
    assignmentsResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from("learners")
      .select("id,first_name,parent_lead_id,parent_leads(parent_name,email)")
      .eq("id", parsed.data.learnerId)
      .maybeSingle(),
    supabase
      .from("teacher_updates")
      .select(
        "occurred_on,note_format,working_on,support_needed,reached,what_happened,why_it_mattered,next_step,teaching_frameworks(title)",
      )
      .eq("learner_id", parsed.data.learnerId)
      .gte("occurred_on", start)
      .lt("occurred_on", endDate)
      .order("occurred_on"),
    supabase
      .from("learner_goals")
      .select("id,title,domain,status,target_date")
      .eq("learner_id", parsed.data.learnerId)
      .order("created_at"),
    supabase
      .from("learner_goal_progress")
      .select("goal_id,progress_state,occurred_on,created_at")
      .eq("learner_id", parsed.data.learnerId)
      .gte("occurred_on", start)
      .lt("occurred_on", endDate)
      .order("created_at", { ascending: false }),
    supabase
      .from("learner_teaching_frameworks")
      .select(
        "id,status,starts_on,ends_on,curriculum_course,exam_board,current_unit_topic,learner_objectives,teaching_frameworks(title),teaching_framework_versions(evidence_guidance,goal_guidance,avoid_guidance)",
      )
      .eq("learner_id", parsed.data.learnerId)
      .lt("starts_on", endDate)
      .or(`ends_on.is.null,ends_on.gte.${start}`)
      .order("starts_on"),
    supabase
      .from("learner_profiles")
      .select("strengths,barriers,interests,helpful_strategies,parent_priorities")
      .eq("learner_id", parsed.data.learnerId)
      .maybeSingle(),
  ])

  const learner = learnerResult.data
  if (!learner) {
    return NextResponse.json({ error: "Learner not found" }, { status: 404 })
  }

  if (notesResult.error || goalsResult.error || goalProgressResult.error || assignmentsResult.error || profileResult.error) {
    return NextResponse.json(
      { error: "Could not load the learner's monthly evidence" },
      { status: 500 },
    )
  }

  const notes = (notesResult.data || []).map((note) => ({
    ...note,
    framework_title: relationOne(note.teaching_frameworks)?.title || null,
  }))

  const goalProgress = goalProgressResult.data || []
  const progressedGoalIds = new Set(goalProgress.map((item) => item.goal_id))
  const goals = (goalsResult.data || []).filter(
    (goal) => goal.status === "active" || progressedGoalIds.has(goal.id),
  )

  const assignments = (assignmentsResult.data || []).map((assignment) => {
    const framework = relationOne(assignment.teaching_frameworks)
    const version = relationOne(assignment.teaching_framework_versions)
    return {
      ...assignment,
      framework_title: framework?.title || null,
      evidence_guidance: version?.evidence_guidance || null,
      goal_guidance: version?.goal_guidance || null,
      avoid_guidance: version?.avoid_guidance || null,
    }
  })

  if (!notes.length && !goalProgress.length) {
    return NextResponse.json(
      { error: "There is no learning evidence to summarise for this month." },
      { status: 400 },
    )
  }

  const parent = relationOne(learner.parent_leads)
  const evidence = buildMonthlyFamilyEvidence({
    learnerName: learner.first_name,
    month: parsed.data.month,
    notes,
    goals,
    goalProgress,
    assignments,
    profile: profileResult.data,
  })

  if (parsed.data.mode === "preview") {
    return NextResponse.json({
      learnerName: learner.first_name,
      parentName: parent?.parent_name || "Parent",
      recipient: parent?.email || "",
      noteCount: evidence.noteCount,
      sections: evidence.sections,
    })
  }

  try {
    const { output } = await generateText({
      model: gateway("openai/gpt-6-sol"),
      providerOptions: {
        gateway: {
          user: user.id,
          tags: ["feature:family-summary", "data:monthly-learning-evidence"],
        },
      },
      output: Output.object({
        schema: z.object({
          subject: z.string().max(140),
          email: z.string().max(5000),
          internalPlan: z.string().max(2500),
        }),
      }),
      instructions: [
        "Draft a warm, concise monthly update for a learner's parent from verified TAA learning evidence.",
        "TAA complements the child's school; this is not a formal school report.",
        "Summarise genuine progress, where support was useful, and the most helpful next learning step.",
        "Use the teaching framework context to interpret the evidence, but do not expose internal framework instructions or staff-only wording.",
        "Do not diagnose, infer protected characteristics, invent facts, exaggerate progress, predict grades or attainment, or mention attendance.",
        "Do not mention AI.",
        "Prefer plain British English and a short email of roughly 2–4 concise paragraphs.",
        "Invite the family to reply if they have useful context from home or school.",
        "Separately create a short internal actionable teaching plan for the next month.",
        evidence.aiGuidanceText
          ? `Framework guidance to respect:\n${evidence.aiGuidanceText}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      prompt: [
        `Learner: ${learner.first_name}`,
        `Parent: ${parent?.parent_name || "Parent"}`,
        `Month: ${parsed.data.month}`,
        "",
        "Verified monthly evidence:",
        evidence.promptText,
      ].join("\n"),
    })

    return NextResponse.json({
      ...output,
      recipient: parent?.email || "",
      learnerName: learner.first_name,
      sections: evidence.sections,
    })
  } catch {
    return NextResponse.json(
      {
        error:
          "AI summary is unavailable. The monthly evidence is ready, but Vercel AI Gateway must be enabled before a draft can be generated.",
        recipient: parent?.email || "",
        learnerName: learner.first_name,
        sections: evidence.sections,
      },
      { status: 502 },
    )
  }
}
