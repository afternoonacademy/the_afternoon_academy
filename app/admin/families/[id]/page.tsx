import Link from "next/link"
import { notFound } from "next/navigation"

import { FamilyBalanceManager } from "@/components/admin/family-balance-manager"
import { FamilyDocumentAuthorisation } from "@/components/admin/family-document-authorisation"
import { FamilyEmailHistory } from "@/components/admin/family-email-history"
import { SessionChangeLauncher } from "@/components/admin/session-change-launcher"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadFamilyEmailPage } from "@/lib/admin/load-family-emails"
import { requireCapability } from "@/lib/auth/require-capability"
import { supabaseAdmin } from "@/lib/supabase/admin"

type PageProps = { params: Promise<{ id: string }> }
type Adjustment = Record<string, unknown>

const money = (cents: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value + "T12:00:00Z"),
  )

function relation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

export default async function FamilyAccountPage({ params }: PageProps) {
  await requireCapability("view_family_pipeline")
  const { id } = await params
  const today = new Date().toISOString().slice(0, 10)

  const [parentResult, learnersResult] = await Promise.all([
    supabaseAdmin
      .from("parent_leads")
      .select("id,parent_name,email,phone,status,account_adjustments")
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("learners")
      .select("id,first_name,year_group,status,child_lead_id,parent_lead_id")
      .eq("parent_lead_id", id)
      .order("first_name"),
  ])

  const parent = parentResult.data
  if (!parent) notFound()

  const learners = learnersResult.data || []
  const learnerIds = learners.map((learner) => learner.id)
  const scopedLearnerIds = learnerIds.length
    ? learnerIds
    : ["00000000-0000-0000-0000-000000000000"]

  const [
    placementsResult,
    entitlementsResult,
    templatesResult,
    plansResult,
    renewalsResult,
    documentsResult,
    initialEmailPage,
  ] = await Promise.all([
    supabaseAdmin
      .from("standing_placements")
      .select("id,learner_id,weekday,starts_at,table_number,seat_number,effective_from,effective_to,status,session_price_plans(name,price_cents)")
      .in("learner_id", learnerIds.length ? learnerIds : scopedLearnerIds)
      .eq("status", "active")
      .order("effective_from"),
    supabaseAdmin
      .from("child_payment_entitlements")
      .select("id,learner_id,period_start,period_end,status,selected_sessions")
      .in("learner_id", learnerIds.length ? learnerIds : scopedLearnerIds)
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
    supabaseAdmin
      .from("family_documents")
      .select("id,status,sent_at,signed_at,send_count,last_email_delivery_log_id")
      .eq("parent_lead_id", id)
      .eq("document_key", "parent_registration_authorisation")
      .maybeSingle(),
    loadFamilyEmailPage({ parentLeadId: id }).catch(() => ({
      items: [],
      hasMore: false,
      nextCursor: null,
      loadError: true,
    })),
  ])

  const placements = placementsResult.data || []
  const entitlements = entitlementsResult.data || []
  const renewals = renewalsResult.data || []
  const registrationDocument = documentsResult.data
  const { data: registrationDelivery } = registrationDocument?.last_email_delivery_log_id
    ? await supabaseAdmin
        .from("email_delivery_log")
        .select("status,sent_at,delivered_at,bounced_at,failed_at,delivery_detail,error_message")
        .eq("id", registrationDocument.last_email_delivery_log_id)
        .maybeSingle()
    : { data: null }

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
    (total, entry) => total + (typeof entry.amountCents === "number" ? entry.amountCents : 0),
    0,
  )

  const attentionItems = [
    ...learners
      .filter((learner) => !placements.some((place) => place.learner_id === learner.id))
      .map((learner) => `${learner.first_name}: no current recurring place`),
    ...renewals
      .filter((item) => item.status === "overdue")
      .map((item) => {
        const learner = learners.find((value) => value.id === item.learner_id)
        return `${learner?.first_name || "Learner"}: renewal overdue`
      }),
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="brand-hero p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="brand-kicker">Family account</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">{parent.parent_name}</h2>
            <p className="mt-1 text-muted-foreground">
              {parent.email}{parent.phone ? ` · ${parent.phone}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="capitalize" variant="outline">{parent.status || "family"}</Badge>
              <Badge variant={familyBalance === 0 ? "secondary" : "outline"}>
                {familyBalance < 0
                  ? `${money(Math.abs(familyBalance))} credit`
                  : familyBalance > 0
                    ? `${money(familyBalance)} due`
                    : "Settled"}
              </Badge>
            </div>
          </div>
          <Link className="text-sm font-semibold text-primary hover:underline" href="/admin/leads">
            Back to Family Pipeline
          </Link>
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList className="h-auto w-full justify-start overflow-x-auto overflow-y-hidden rounded-none border-b bg-transparent p-0 lg:overflow-visible" variant="line">
          <TabsTrigger className="min-w-fit px-4 py-3" value="overview">Overview</TabsTrigger>
          <TabsTrigger className="min-w-fit px-4 py-3" value="children">Children & places</TabsTrigger>
          <TabsTrigger className="min-w-fit px-4 py-3" value="payments">Payments & renewals</TabsTrigger>
          <TabsTrigger className="min-w-fit px-4 py-3" value="emails">Email history</TabsTrigger>
          <TabsTrigger className="min-w-fit px-4 py-3" value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4 pt-4" value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Children</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {learners.length ? learners.map((learner) => (
                  <Link className="block font-medium text-primary hover:underline" href={`/admin/learners/${learner.id}`} key={learner.id}>
                    {learner.first_name}
                    {learner.year_group ? ` · Year ${String(learner.year_group).replace(/^Year\s*/i, "")}` : ""}
                  </Link>
                )) : <p className="text-muted-foreground">No learners linked to this family yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Account</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <p className="text-2xl font-bold">
                  {familyBalance < 0
                    ? `${money(Math.abs(familyBalance))} credit`
                    : familyBalance > 0
                      ? `${money(familyBalance)} due`
                      : "Settled"}
                </p>
                <p className="mt-1 text-muted-foreground">Household balance across all children.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Registration</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium capitalize">
                  {registrationDocument?.status?.replaceAll("_", " ") || "Not sent"}
                </p>
                <p className="mt-1 text-muted-foreground">Parent Registration & Authorisation</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Needs attention</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {attentionItems.length ? (
                <ul className="space-y-2">
                  {attentionItems.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              ) : <p className="text-muted-foreground">No current family administration warnings.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4 pt-4" value="children">
          {learners.length ? learners.map((learner) => {
            const entitlement = latestEntitlementByLearner.get(learner.id)
            const childPlacements = placements.filter((place) => place.learner_id === learner.id)
            const currentPlaces = childPlacements.filter(
              (place) =>
                place.effective_from <= today &&
                (!place.effective_to || place.effective_to >= today),
            )
            const futurePlaces = childPlacements.filter((place) => place.effective_from > today)
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
                        {learner.year_group
                          ? `Year ${String(learner.year_group).replace(/^Year\s*/i, "")}`
                          : "Year group to confirm"}
                      </p>
                    </div>
                    <Link className="text-sm font-semibold text-primary hover:underline" href={`/admin/learners/${learner.id}`}>
                      Open learning record
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current place</p>
                      {currentPlaces.length ? currentPlaces.map((place) => {
                        const plan = relation(place.session_price_plans)
                        return (
                          <p className="mt-1 text-sm" key={place.id}>
                            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][place.weekday]} · {place.starts_at.slice(0,5)} · Table {place.table_number}
                            {plan ? ` · ${plan.name} · ${money(plan.price_cents)}` : ""}
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
                  </div>

                  {futurePlaces.length ? (
                    <div className="rounded-md border bg-muted/20 p-3 text-sm">
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
          }) : (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No learners linked to this family yet.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent className="space-y-4 pt-4" value="payments">
          <Card>
            <CardHeader><CardTitle>Family balance</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current balance</p>
                <p className="mt-1 text-3xl font-bold">
                  {familyBalance < 0
                    ? `${money(Math.abs(familyBalance))} credit`
                    : familyBalance > 0
                      ? `${money(familyBalance)} due`
                      : "Settled"}
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
                                ? `${money(Math.abs(amount))} credit`
                                : amount > 0
                                  ? `${money(amount)} due/offset`
                                  : "No balance change"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {String(entry.entryType || "adjustment").replaceAll("_", " ")}
                            {entry.reason ? ` · ${String(entry.reason)}` : ""}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="mt-2 text-sm text-muted-foreground">No family account adjustments yet.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Renewals</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {learners.length ? learners.map((learner) => {
                const renewal = renewals.find((item) => item.learner_id === learner.id)
                return (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0" key={learner.id}>
                    <div>
                      <p className="font-medium">{learner.first_name}</p>
                      <p className="text-muted-foreground">
                        {renewal ? renewal.status.replaceAll("_", " ") : "No renewal prepared"}
                      </p>
                    </div>
                    {renewal?.proposed_amount_cents != null ? (
                      <Badge variant="outline">{money(renewal.proposed_amount_cents)}</Badge>
                    ) : null}
                  </div>
                )
              }) : <p className="text-muted-foreground">No learners linked to this family yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="pt-4" value="emails">
          <Card>
            <CardContent className="pt-6">
              <FamilyEmailHistory
                initialError={"loadError" in initialEmailPage ? "Could not load recorded Academy email history." : ""}
                initialHasMore={initialEmailPage.hasMore}
                initialItems={initialEmailPage.items}
                initialNextCursor={initialEmailPage.nextCursor}
                parentLeadId={parent.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="pt-4" value="documents">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">Family documents</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Household-level forms and authorisations are managed here.
              </p>
            </div>
            <FamilyDocumentAuthorisation
              delivery={registrationDelivery}
              parentLeadId={parent.id}
              record={registrationDocument}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
