import { supabaseAdmin } from "@/lib/supabase/admin"

const monthKey = (value: string) => String(value).slice(0, 7)

export async function loadFinanceAnalytics() {
  const [{ data: payments }, { data: parents }] = await Promise.all([
    supabaseAdmin
      .from("payment_entitlements")
      .select("parent_lead_id,amount_cents,status,received_at")
      .eq("status", "paid")
      .order("received_at"),
    supabaseAdmin.from("parent_leads").select("id,parent_name,email"),
  ])

  const parentById = new Map((parents || []).map((parent) => [parent.id, parent]))
  const currentYear = new Date().getFullYear()

  const monthly = Array.from({ length: 12 }, (_, index) => ({
    key: `${currentYear}-${String(index + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
      new Date(Date.UTC(currentYear, index, 1)),
    ),
    revenueCents: 0,
  }))

  const lifetimeByFamily = new Map<string, number>()
  let lifetimeRevenueCents = 0

  for (const payment of payments || []) {
    const amount = Number(payment.amount_cents || 0)
    lifetimeRevenueCents += amount

    if (
      payment.received_at &&
      String(payment.received_at).startsWith(String(currentYear))
    ) {
      const month = monthly.find(
        (item) => item.key === monthKey(payment.received_at),
      )
      if (month) month.revenueCents += amount
    }

    if (payment.parent_lead_id) {
      lifetimeByFamily.set(
        payment.parent_lead_id,
        (lifetimeByFamily.get(payment.parent_lead_id) || 0) + amount,
      )
    }
  }

  const customerLifetime = [...lifetimeByFamily.entries()]
    .map(([parentLeadId, revenueCents]) => {
      const parent = parentById.get(parentLeadId)
      return {
        parentLeadId,
        parentName: parent?.parent_name || parent?.email || "Family",
        revenueCents,
      }
    })
    .sort((a, b) => b.revenueCents - a.revenueCents)

  return {
    monthly,
    customerLifetime,
    lifetimeRevenueCents,
    averageLifetimeValueCents: customerLifetime.length
      ? Math.round(lifetimeRevenueCents / customerLifetime.length)
      : 0,
  }
}
