import Link from "next/link"
import { notFound } from "next/navigation"

import { FamilyBalanceManager } from "@/components/admin/family-balance-manager"
import { SessionChangeLauncher } from "@/components/admin/session-change-launcher"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseAdmin } from "@/lib/supabase/admin"

import { requireCapability } from "@/lib/auth/require-capability"

type PageProps = { params: Promise<{ id: string }> }

type Adjustment = Record<string, unknown>

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value + "T12:00:00Z"))

function relation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

export default async function FamilyAccountPage({ params }: PageProps) {
  await requireCapability("view_family_pipeline")
  const { id } = await params
  const today = new Date().toISOString().slice(0, 10)

  const [
    parentResult,
    learnersResult,
    placementsResult,
    entitlementsResult,
    templatesResult,
    plansResult,
    renewalsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("parent_leads")
      .select("id,parent_name,email,phone,account_adjustments")
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("learners")
      .select("id,first_name,year_group,status,child_lead_id,parent_lead_id")
      .eq("parent_lead_id", id)
      .order("first_name"),
    supabaseAdmin
      .from("standing_placements")
      .select("id,learner_id,weekday,starts_at,table_number,seat_number,effective_from,effective_to,status,session_price_plans(name,price_cents)")
      .eq("status", "active")
      .order("effective_from"),
    supabaseAdmin
      .from("child_payment_entitlements")
      .select("id,learner_id,period_start,period_end,status,selected_sessions")
      .eq("status", "paid")
      .order("period_end", { ascending: false }),
    supabaseAdmin
      .from("weekly_table_templates")
      .select("id,weekday,starts_at,table_number,focus")
      .eq("status", "active")
      .order("weekday")
      .order("starts_at")
      .order("table_number"),
    supabaseAdmin
      .from("session_price_plans")
      .select("id,name,price_cents")
      .eq("status", "active")
      .order("price_cents")
      .order("name"),
    supabaseAdmin
      .from("renewal_cases")
      .select("id,learner_id,status,email_sent_at,proposed_amount_cents,proposed_period_start,proposed_period_end")
      .eq("parent_lead_id", id)
      .in("status", ["ready_to_send", "awaiting_payment", "overdue"])
      .order("created_at", { ascending: false }),
  ])

  const parent = parentResult.data
  if (!parent) notFound()

  const learners = learnersResult.data || []
  const placements = placementsResult.data || []
  const entitlements = entitlementsResult.data || []
  const renewals = renewalsResult.data || []

  const latestEntitlementByLearner = new Map<string, (typeof entitlements)[number]>()
  for (const entitlement of entitlements) {
    if (!latestEntitlementByLearner.has(entitlement.learner_id)) {
      latestEntitlementByLearner.set(entitlement.learner_id, entitlement)
    }
  }

  const adjustments = Array.isArray(parent.account_adjustments)
    ? (parent.account_adjustments as Adjustment[])
    : []
  const familyBalance = adjustments.reduce(
    (total, entry) =>
      total + (typeof entry.amountCents === "number" ? entry.amountCents : 0),
    0,
  )

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Family account</p>
          <h2 className="text-3xl font-bold tracking-tight">{parent.parent_name}</h2>
          <p className="text-muted-foreground">
            {parent.email}{parent.phone ? " · " + parent.phone : ""}
          </p>
        </div>
        <Link className="text-sm font-semibold text-primary hover:underline" href="/admin/leads">
          Back to Family Pipeline
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Family balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current balance
            </p>
            <p className="mt-1 text-3xl font-bold">
              {familyBalance < 0
                ? money(Math.abs(familyBalance)) + " credit"
                : familyBalance > 0
                  ? money(familyBalance) + " due"
                  : "Settled"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Money is held at family level. Session history remains attributed to the child who created the adjustment.
            </p>
          </div>

          {familyBalance !== 0 ? (
            <FamilyBalanceManager
              familyBalanceCents={familyBalance}
              learners={learners.map((learner) => ({
                id: learner.id,
                firstName: learner.first_name,
              }))}
              parentLeadId={parent.id}
              preparedRenewalAmounts={Object.fromEntries(
              learners.map((learner) => {
                const renewal = renewals.find(
                  (item) =>
                    item.learner_id === learner.id &&
                    item.status === "ready_to_send" &&
                    !item.email_sent_at,
                )
                return [learner.id, renewal?.proposed_amount_cents ?? null]
              }),
            )}
            />
          ) : null}

          <div>
            <p className="font-semibold">Account history</p>
            {adjustments.length ? (
              <div className="mt-3 space-y-2 text-sm">
                {adjustments.slice().reverse().map((entry, index) => {
                  const amount = typeof entry.amountCents === "number" ? entry.amountCents : 0
                  return (
                    <div className="rounded-md border p-3" key={String(entry.id || index)}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {String(entry.originatingLearnerName || entry.appliedToLearnerName || "Family adjustment")}
                        </p>
                        <Badge variant="secondary">
                          {amount < 0
                            ? money(Math.abs(amount)) + " credit"
                            : amount > 0
                              ? money(amount) + " due/offset"
                              : "No balance change"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {String(entry.entryType || "adjustment").replaceAll("_", " ")}
                        {entry.reason ? " · " + String(entry.reason) : ""}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No family account adjustments yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">Children & future sessions</h3>
          <p className="text-sm text-muted-foreground">
            All prepaid timetable changes and rate changes are managed here at family level.
          </p>
        </div>

        {learners.map((learner) => {
          const entitlement = latestEntitlementByLearner.get(learner.id)
          const childPlacements = placements.filter((place) => place.learner_id === learner.id)
          const currentPlaces = childPlacements.filter(
            (place) =>
              place.effective_from <= today &&
              (!place.effective_to || place.effective_to >= today),
          )
          const futurePlaces = childPlacements.filter((place) => place.effective_from > today)
          const renewal = renewals.find((item) => item.learner_id === learner.id)
          const sessions = Array.isArray(entitlement?.selected_sessions)
            ? entitlement.selected_sessions
                .map((session) => {
                  if (!session || typeof session !== "object" || Array.isArray(session)) return null
                  const value = session as Record<string, unknown>
                  if (
                    typeof value.date !== "string" ||
                    typeof value.startsAt !== "string" ||
                    typeof value.priceCents !== "number" ||
                    typeof value.pricePlanName !== "string"
                  ) return null
                  return {
                    date: value.date,
                    startsAt: value.startsAt,
                    priceCents: value.priceCents,
                    pricePlanName: value.pricePlanName,
                  }
                })
                .filter((session): session is { date: string; startsAt: string; priceCents: number; pricePlanName: string } => Boolean(session))
                .sort((a, b) => a.date.localeCompare(b.date))
            : []

          return (
            <Card key={learner.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{learner.first_name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {learner.year_group ? "Year " + String(learner.year_group).replace(/^Year\s*/i, "") : "Year group to confirm"}
                    </p>
                  </div>
                  <Link
                    className="text-sm font-semibold text-primary hover:underline"
                    href={"/admin/learners/" + learner.id}
                  >
                    Open learning record
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current place</p>
                    {currentPlaces.length ? currentPlaces.map((place) => {
                      const plan = relation(place.session_price_plans)
                      return (
                        <p className="mt-1 text-sm" key={place.id}>
                          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][place.weekday]} · {place.starts_at.slice(0,5)} · Table {place.table_number}
                          {plan ? " · " + plan.name + " · " + money(plan.price_cents) : ""}
                        </p>
                      )
                    }) : <p className="mt-1 text-sm text-muted-foreground">No current recurring place</p>}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paid through</p>
                    <p className="mt-1 text-sm font-semibold">
                      {entitlement?.period_end ? formatDate(entitlement.period_end) : "No current paid period"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next renewal</p>
                    {renewal ? (
                      <p className="mt-1 text-sm">
                        {renewal.status.replaceAll("_", " ")}
                        {typeof renewal.proposed_amount_cents === "number"
                          ? " · " + money(renewal.proposed_amount_cents)
                          : ""}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Not prepared yet</p>
                    )}
                  </div>
                </div>

                {futurePlaces.length ? (
                  <div className="rounded-md border bg-blue-50 px-3 py-2 text-sm text-blue-950">
                    <p className="font-semibold">Future recurring place scheduled</p>
                    {futurePlaces.map((place) => (
                      <p key={place.id}>
                        From {formatDate(place.effective_from)} · {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][place.weekday]} · {place.starts_at.slice(0,5)} · Table {place.table_number}
                      </p>
                    ))}
                  </div>
                ) : null}

                {entitlement?.period_end && sessions.length ? (
                  <SessionChangeLauncher
                    learnerId={learner.id}
                    paidThrough={entitlement.period_end}
                    sessions={sessions}
                    templates={(templatesResult.data || []).map((item) => ({
                      id: item.id,
                      weekday: item.weekday,
                      startsAt: item.starts_at,
                      tableNumber: item.table_number,
                      focus: item.focus,
                    }))}
                    plans={(plansResult.data || []).map((item) => ({
                      id: item.id,
                      name: item.name,
                      priceCents: item.price_cents,
                    }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No current exact-date paid sessions are available to change.
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
