import {
  FAMILY_EMAIL_PAGE_SIZE,
  buildFamilyEmailCursorFilter,
  decodeFamilyEmailCursor,
  pageFamilyEmailRows,
} from "@/lib/admin/family-email-history.mjs"
import { supabaseAdmin } from "@/lib/supabase/admin"

const selectFields =
  "id,parent_lead_id,child_lead_id,learner_id,renewal_case_id,email_kind,recipient_email,status,subject,body_text,sent_at,delivered_at,bounced_at,failed_at,delivery_detail,error_message,created_at,child_leads(first_name),learners(first_name)"

export async function loadFamilyEmailPage({
  parentLeadId,
  cursor,
}: {
  parentLeadId: string
  cursor?: string | null
}) {
  let query = supabaseAdmin
    .from("email_delivery_log")
    .select(selectFields)
    .eq("parent_lead_id", parentLeadId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FAMILY_EMAIL_PAGE_SIZE + 1)

  if (cursor) {
    const value = decodeFamilyEmailCursor(cursor)
    query = query.or(buildFamilyEmailCursorFilter(value))
  }

  const { data, error } = await query
  if (error) throw new Error("Could not load family email history")

  return pageFamilyEmailRows(data || [])
}
