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