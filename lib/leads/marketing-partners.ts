import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"

export async function loadMarketingPartners(includeInactive = false) {
  const query = supabaseAdmin.from("academy_marketing_partners").select("id,name,active").order("name")
  return includeInactive ? query : query.eq("active", true)
}
