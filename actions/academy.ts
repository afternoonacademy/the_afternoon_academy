"use server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { supabaseService } from "@/lib/supabase/service"

export async function addBuilding(formData: FormData) {
 await requireAdmin(); const p=z.object({name:z.string().trim().min(2).max(120)}).safeParse({name:formData.get("name")}); if(!p.success) throw new Error("Enter a building name")
 const {error}=await supabaseService().from("academy_buildings").insert({name:p.data.name}); if(error) throw new Error("Could not add building"); revalidatePath("/admin/setup")
}
export async function addRoom(formData: FormData) {
 await requireAdmin(); const p=z.object({buildingId:z.string().uuid(),name:z.string().trim().min(2).max(120),roomType:z.enum(["group","tutor","other"]),capacity:z.coerce.number().int().min(1).max(100)}).safeParse({buildingId:formData.get("buildingId"),name:formData.get("name"),roomType:formData.get("roomType"),capacity:formData.get("capacity")}); if(!p.success) throw new Error("Complete the room details")
 const {error}=await supabaseService().from("academy_rooms").insert({building_id:p.data.buildingId,name:p.data.name,room_type:p.data.roomType,capacity:p.data.capacity}); if(error) throw new Error("Could not add room"); revalidatePath("/admin/setup")
}

const updateBuildingSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(120), address: z.string().trim().max(300).optional() })
const updateRoomSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(120), roomType: z.enum(["group", "tutor", "other"]), capacity: z.coerce.number().int().min(1).max(100) })
const tableSchema = z.object({ roomId: z.string().uuid(), name: z.string().trim().min(2).max(120), capacity: z.coerce.number().int().min(1).max(40) })

export async function updateBuilding(formData: FormData) {
  await requireAdmin(); const p = updateBuildingSchema.safeParse({ id: formData.get("id"), name: formData.get("name"), address: formData.get("address") || undefined }); if (!p.success) throw new Error("Complete the building details")
  const { error } = await supabaseService().from("academy_buildings").update({ name: p.data.name, address: p.data.address || null }).eq("id", p.data.id); if (error) throw new Error("Could not update building"); revalidatePath("/admin/setup")
}
export async function updateRoom(formData: FormData) {
  await requireAdmin(); const p = updateRoomSchema.safeParse({ id: formData.get("id"), name: formData.get("name"), roomType: formData.get("roomType"), capacity: formData.get("capacity") }); if (!p.success) throw new Error("Complete the room details")
  const { error } = await supabaseService().from("academy_rooms").update({ name: p.data.name, room_type: p.data.roomType, capacity: p.data.capacity }).eq("id", p.data.id); if (error) throw new Error("Could not update room"); revalidatePath("/admin/setup")
}
export async function addTable(formData: FormData) {
  await requireAdmin(); const p = tableSchema.safeParse({ roomId: formData.get("roomId"), name: formData.get("name"), capacity: formData.get("capacity") }); if (!p.success) throw new Error("Complete the table details")
  const { error } = await supabaseService().from("academy_tables").insert({ room_id: p.data.roomId, name: p.data.name, seat_capacity: p.data.capacity }); if (error) throw new Error("Could not add table"); revalidatePath("/admin/setup")
}
export async function archiveAcademyRecord(formData: FormData) {
  await requireAdmin(); const p = z.object({ type: z.enum(["building", "room", "table"]), id: z.string().uuid() }).safeParse({ type: formData.get("type"), id: formData.get("id") }); if (!p.success) throw new Error("Invalid Academy record")
  const table = p.data.type === "building" ? "academy_buildings" : p.data.type === "room" ? "academy_rooms" : "academy_tables"
  const { error } = await supabaseService().from(table).update({ status: "inactive" }).eq("id", p.data.id); if (error) throw new Error(error.message.includes("archive") ? error.message : "Could not archive this record"); revalidatePath("/admin/setup")
}

const closureSchema = z.object({
  startsOn: z.string().date(),
  endsOn: z.string().date(),
  reason: z.string().trim().min(2).max(160),
}).refine((value) => value.endsOn >= value.startsOn, { message: "Closure end date must follow its start date" })

export async function addAcademyClosure(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = closureSchema.safeParse({ startsOn: formData.get("startsOn"), endsOn: formData.get("endsOn"), reason: formData.get("reason") })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Complete the closure details")
  const { error } = await supabaseService().from("academy_closures").insert({ starts_on: parsed.data.startsOn, ends_on: parsed.data.endsOn, reason: parsed.data.reason, created_by: user.id, updated_by: user.id })
  if (error) throw new Error("Could not save the Academy closure")
  revalidatePath("/admin/setup"); revalidatePath("/admin"); revalidatePath("/admin/renewals")
}

export async function deleteAcademyClosure(formData: FormData) {
  await requireAdmin()
  const parsed = z.object({ id: z.string().uuid() }).safeParse({ id: formData.get("id") })
  if (!parsed.success) throw new Error("Invalid closure")
  const { error } = await supabaseService().from("academy_closures").delete().eq("id", parsed.data.id)
  if (error) throw new Error("Could not remove the Academy closure")
  revalidatePath("/admin/setup"); revalidatePath("/admin"); revalidatePath("/admin/renewals")
}

export async function saveRenewalEmailTemplate(formData: FormData) {
  const { user } = await requireAdmin()
  const parsed = z.object({ subject: z.string().trim().min(2).max(200), body: z.string().trim().min(2).max(12000) }).safeParse({ subject: formData.get("subject"), body: formData.get("body") })
  if (!parsed.success) throw new Error("Enter a subject and email body")
  const { error } = await supabaseService().from("academy_email_templates").upsert({ template_key: "renewal_reminder", subject_template: parsed.data.subject, body_template: parsed.data.body, updated_by: user.id }, { onConflict: "template_key" })
  if (error) throw new Error("Could not save the renewal email template")
  revalidatePath("/admin/setup"); revalidatePath("/admin/renewals")
}

export async function saveSessionPrice(formData: FormData) {
  await requireAdmin()
  const parsed = z.object({ id: z.string().uuid(), priceEuros: z.coerce.number().min(0).max(10000) }).safeParse({ id: formData.get("id"), priceEuros: formData.get("priceEuros") })
  if (!parsed.success) throw new Error("Enter a valid per-session price")
  const { error } = await supabaseService().from("weekly_table_templates").update({ session_price_cents: Math.round(parsed.data.priceEuros * 100) }).eq("id", parsed.data.id)
  if (error) throw new Error("Could not save the session price")
  revalidatePath("/admin/setup"); revalidatePath("/admin/renewals")
}
