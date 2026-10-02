import { Badge } from "@/components/ui/badge"

export type FamilyCommunication = {
  id: string
  parent_lead_id: string
  child_lead_id: string | null
  learner_id: string | null
  renewal_case_id: string | null
  email_kind: string
  recipient_email: string
  status: string
  subject: string | null
  body_text: string | null
  sent_at: string | null
  delivered_at: string | null
  bounced_at: string | null
  failed_at: string | null
  delivery_detail: string | null
  created_at: string
}

const kindLabel: Record<string, string> = {
  enquiry_acknowledgement: "Enquiry acknowledgement",
  place_offer: "Place offer",
  planned_place: "Planned place email",
  payment_confirmed: "Payment confirmation",
  portal_access: "Portal access",
  learning_update: "Learning update",
  renewal_reminder: "Renewal email",
}

function statusLabel(status: string) {
  if (status === "delivered") return "Delivered"
  if (status === "bounced") return "Bounced"
  if (status === "failed") return "Failed"
  if (status === "delayed") return "Delivery delayed"
  if (status === "sent") return "Sent"
  return "Pending"
}

function statusVariant(status: string) {
  if (status === "delivered") return "default" as const
  if (status === "bounced" || status === "failed") return "destructive" as const
  return "secondary" as const
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function FamilyCommunications({
  communications,
  emptyLabel = "No parent communications recorded yet.",
}: {
  communications: FamilyCommunication[]
  emptyLabel?: string
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Family communications</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Parent-facing communications only. Delivery status is tracked; open
            and click tracking are not used.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {communications.length} message{communications.length === 1 ? "" : "s"}
        </span>
      </div>

      {communications.length ? (
        <div className="mt-3 overflow-hidden rounded-lg border">
          <div className="divide-y">
            {communications.map((item) => {
              const eventTime =
                item.delivered_at ||
                item.bounced_at ||
                item.failed_at ||
                item.sent_at ||
                item.created_at

              return (
                <details className="group bg-background" key={item.id}>
                  <summary className="grid cursor-pointer list-none gap-2 p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {kindLabel[item.email_kind] ||
                          item.email_kind.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {item.subject || "No subject"} · {item.recipient_email}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge variant={statusVariant(item.status)}>
                        {statusLabel(item.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(eventTime)}
                      </span>
                    </div>
                  </summary>

                  <div className="border-t bg-muted/10 p-4 text-sm">
                    {item.delivery_detail ? (
                      <p
                        className={
                          item.status === "bounced" || item.status === "failed"
                            ? "mb-3 font-medium text-destructive"
                            : "mb-3 text-muted-foreground"
                        }
                      >
                        {item.delivery_detail}
                      </p>
                    ) : null}
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Subject
                    </p>
                    <p className="mt-1">{item.subject || "—"}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Message sent
                    </p>
                    <div className="mt-2 whitespace-pre-wrap rounded-md border bg-background p-3 leading-relaxed">
                      {item.body_text || "Message body was not retained."}
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      )}
    </section>
  )
}
