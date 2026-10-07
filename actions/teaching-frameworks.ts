"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { assertCapability } from "@/lib/auth/require-capability"
import { normalizeTeachingFrameworkPrompts } from "@/lib/teaching/frameworks.mjs"
import { nextFrameworkVersionNumber } from "@/lib/teaching/framework-actions.mjs"
import { supabaseService } from "@/lib/supabase/service"

const frameworkSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().max(800).optional(),
  stageGuidance: z.string().trim().max(2000).optional(),
  provisionType: z.string().trim().max(160).optional(),
})

const frameworkContentSchema = z.object({
  frameworkId: z.string().uuid(),
  versionId: z.string().uuid().optional(),
  preparationGuidance: z.string().trim().max(6000).optional(),
  duringSessionGuidance: z.string().trim().max(6000).optional(),
  goalGuidance: z.string().trim().max(6000).optional(),
  evidenceGuidance: z.string().trim().max(6000).optional(),
  avoidGuidance: z.string().trim().max(6000).optional(),
  promptConfig: z.string().min(2).max(20000),
  referenceResources: z.string().max(20000).optional(),
})

const frameworkActionSchema = z.object({ frameworkId: z.string().uuid() })

function optionalText(value) {
  const text = String(value || "").trim()
  return text || null
}

function parsePromptConfig(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("Prompt configuration must be valid JSON")
  }
  return normalizeTeachingFrameworkPrompts(parsed)
}

function parseReferenceResources(raw) {
  const text = String(raw || "").trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error()
    return parsed.slice(0, 30)
  } catch {
    throw new Error("Reference resources must be a JSON list")
  }
}

export async function createTeachingFramework(formData: FormData) {
  const { internalUser } = await assertCapability("manage_teaching_frameworks")
  const parsed = frameworkSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription") || undefined,
    stageGuidance: formData.get("stageGuidance") || undefined,
    provisionType: formData.get("provisionType") || undefined,
  })
  if (!parsed.success) throw new Error("Please check the teaching framework details")

  const { data, error } = await supabaseService()
    .from("teaching_frameworks")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      short_description: parsed.data.shortDescription || null,
      stage_guidance: parsed.data.stageGuidance || null,
      provision_type: parsed.data.provisionType || null,
      status: "draft",
      created_by: internalUser.id,
      updated_by: internalUser.id,
    })
    .select("id")
    .single()

  if (error || !data) throw new Error("Could not create the teaching framework")
  revalidatePath("/admin/teaching")
  return data.id
}

export async function saveTeachingFrameworkDraft(formData: FormData) {
  const { internalUser } = await assertCapability("manage_teaching_frameworks")
  const parsed = frameworkContentSchema.safeParse({
    frameworkId: formData.get("frameworkId"),
    versionId: formData.get("versionId") || undefined,
    preparationGuidance: formData.get("preparationGuidance") || undefined,
    duringSessionGuidance: formData.get("duringSessionGuidance") || undefined,
    goalGuidance: formData.get("goalGuidance") || undefined,
    evidenceGuidance: formData.get("evidenceGuidance") || undefined,
    avoidGuidance: formData.get("avoidGuidance") || undefined,
    promptConfig: formData.get("promptConfig"),
    referenceResources: formData.get("referenceResources") || undefined,
  })
  if (!parsed.success) throw new Error("Please check the teaching framework content")

  const supabase = supabaseService()
  const promptConfig = parsePromptConfig(parsed.data.promptConfig)
  const referenceResources = parseReferenceResources(parsed.data.referenceResources)

  if (parsed.data.versionId) {
    const { data: existing, error: readError } = await supabase
      .from("teaching_framework_versions")
      .select("id,published_at")
      .eq("id", parsed.data.versionId)
      .eq("framework_id", parsed.data.frameworkId)
      .maybeSingle()
    if (readError || !existing) throw new Error("Framework version not found")
    if (existing.published_at) throw new Error("Published framework versions are immutable")

    const { error } = await supabase
      .from("teaching_framework_versions")
      .update({
        preparation_guidance: optionalText(parsed.data.preparationGuidance),
        during_session_guidance: optionalText(parsed.data.duringSessionGuidance),
        goal_guidance: optionalText(parsed.data.goalGuidance),
        evidence_guidance: optionalText(parsed.data.evidenceGuidance),
        avoid_guidance: optionalText(parsed.data.avoidGuidance),
        prompt_config: promptConfig,
        reference_resources: referenceResources,
      })
      .eq("id", existing.id)
    if (error) throw new Error("Could not save framework draft")
  } else {
    const { data: versions, error: versionError } = await supabase
      .from("teaching_framework_versions")
      .select("version_number")
      .eq("framework_id", parsed.data.frameworkId)
    if (versionError) throw new Error("Could not read framework versions")
    const { error } = await supabase.from("teaching_framework_versions").insert({
      framework_id: parsed.data.frameworkId,
      version_number: nextFrameworkVersionNumber(versions || []),
      preparation_guidance: optionalText(parsed.data.preparationGuidance),
      during_session_guidance: optionalText(parsed.data.duringSessionGuidance),
      goal_guidance: optionalText(parsed.data.goalGuidance),
      evidence_guidance: optionalText(parsed.data.evidenceGuidance),
      avoid_guidance: optionalText(parsed.data.avoidGuidance),
      prompt_config: promptConfig,
      reference_resources: referenceResources,
      created_by: internalUser.id,
    })
    if (error) throw new Error("Could not create framework draft")
  }

  revalidatePath("/admin/teaching")
  revalidatePath("/admin/teaching/frameworks/" + parsed.data.frameworkId)
}

export async function createTeachingFrameworkDraftVersion(formData: FormData) {
  const { internalUser } = await assertCapability("manage_teaching_frameworks")
  const parsed = z.object({
    frameworkId: z.string().uuid(),
    sourceVersionId: z.string().uuid(),
  }).safeParse({
    frameworkId: formData.get("frameworkId"),
    sourceVersionId: formData.get("sourceVersionId"),
  })
  if (!parsed.success) throw new Error("Framework version could not be identified")

  const supabase = supabaseService()
  const [{ data: source, error: sourceError }, { data: versions, error: versionsError }] =
    await Promise.all([
      supabase
        .from("teaching_framework_versions")
        .select("preparation_guidance,during_session_guidance,goal_guidance,evidence_guidance,avoid_guidance,reference_resources,prompt_config")
        .eq("id", parsed.data.sourceVersionId)
        .eq("framework_id", parsed.data.frameworkId)
        .maybeSingle(),
      supabase
        .from("teaching_framework_versions")
        .select("version_number")
        .eq("framework_id", parsed.data.frameworkId),
    ])

  if (sourceError || !source) throw new Error("Published framework version not found")
  if (versionsError) throw new Error("Could not read framework versions")

  const { error } = await supabase.from("teaching_framework_versions").insert({
    framework_id: parsed.data.frameworkId,
    version_number: nextFrameworkVersionNumber(versions || []),
    preparation_guidance: source.preparation_guidance,
    during_session_guidance: source.during_session_guidance,
    goal_guidance: source.goal_guidance,
    evidence_guidance: source.evidence_guidance,
    avoid_guidance: source.avoid_guidance,
    reference_resources: source.reference_resources || [],
    prompt_config: source.prompt_config || [],
    created_by: internalUser.id,
  })

  if (error) throw new Error("Could not create a new framework draft")
  revalidatePath("/admin/teaching/frameworks/" + parsed.data.frameworkId)
}

export async function publishTeachingFrameworkVersion(formData: FormData) {
  const { internalUser } = await assertCapability("manage_teaching_frameworks")
  const parsed = z.object({ frameworkId: z.string().uuid(), versionId: z.string().uuid() }).safeParse({
    frameworkId: formData.get("frameworkId"),
    versionId: formData.get("versionId"),
  })
  if (!parsed.success) throw new Error("Framework version could not be identified")

  const supabase = supabaseService()
  const now = new Date().toISOString()
  const { data: version, error: versionError } = await supabase
    .from("teaching_framework_versions")
    .select("id,published_at")
    .eq("id", parsed.data.versionId)
    .eq("framework_id", parsed.data.frameworkId)
    .maybeSingle()
  if (versionError || !version) throw new Error("Framework version not found")

  if (!version.published_at) {
    const { error } = await supabase
      .from("teaching_framework_versions")
      .update({ published_at: now })
      .eq("id", version.id)
    if (error) throw new Error("Could not publish framework version")
  }

  const { error } = await supabase
    .from("teaching_frameworks")
    .update({
      status: "published",
      current_version_id: version.id,
      updated_by: internalUser.id,
      updated_at: now,
    })
    .eq("id", parsed.data.frameworkId)
  if (error) throw new Error("Could not publish teaching framework")

  const { error: assignmentError } = await supabase
    .from("learner_teaching_frameworks")
    .update({
      framework_version_id: version.id,
      updated_by: internalUser.id,
      updated_at: now,
    })
    .eq("framework_id", parsed.data.frameworkId)
    .in("status", ["active", "paused"])
  if (assignmentError) {
    throw new Error("Framework published, but learner teaching contexts could not be updated")
  }

  revalidatePath("/admin/teaching")
  revalidatePath("/admin/teaching/frameworks/" + parsed.data.frameworkId)
}

export async function archiveTeachingFramework(formData: FormData) {
  const { internalUser } = await assertCapability("manage_teaching_frameworks")
  const parsed = frameworkActionSchema.safeParse({ frameworkId: formData.get("frameworkId") })
  if (!parsed.success) throw new Error("Framework could not be identified")

  const { error } = await supabaseService()
    .from("teaching_frameworks")
    .update({
      status: "archived",
      updated_by: internalUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.frameworkId)
  if (error) throw new Error("Could not archive teaching framework")

  revalidatePath("/admin/teaching")
}
