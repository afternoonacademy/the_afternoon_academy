import {
  markRegistrationAuthorisationSigned,
  sendRegistrationAuthorisationForm,
} from "@/actions/family-documents"
import {
  REGISTRATION_AUTHORISATION_FORM_URL,
  familyDocumentStatus,
} from "@/lib/admin/family-documents.mjs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type FamilyDocumentRecord = {
  status: string
  sent_at: string | null
  signed_at: string | null
  send_count: number
}

type DeliveryRecord = {
  status: string
  sent_at: string | null
  delivered_at: string | null
  bounced_at: string | null
  failed_at: string | null
  delivery_detail: string | null
  error_message: string | null
} | null

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

function statusLabel(status: string) {
  if (status === "signed") return "Signed"
  if (status === "sent") return "Awaiting signature"
  return "Not sent"
}

function deliveryLabel(status: string | undefined) {
  if (!status) return null
  if (status === "delivered") return "Delivered"
  if (status === "bounced") return "Bounced"
  if (status === "failed") return "Failed"
  if (status === "delayed") return "Delayed"
  if (status === "sent") return "Sent"
  return status
}

export function FamilyDocumentAuthorisation({
  parentLeadId,
  record,
  delivery,
}: {
  parentLeadId: string
  record: FamilyDocumentRecord | null
  delivery: DeliveryRecord
}) {
  const status = familyDocumentStatus(record)
  const today = new Date().toISOString().slice(0, 10)
  const deliveryTime =
    delivery?.delivered_at ||
    delivery?.bounced_at ||
    delivery?.failed_at ||
    delivery?.sent_at

  return (
    <section className="rounded-xl border bg-muted/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Documents & authorisations</p>
          <h3 className="mt-1 text-lg font-bold">
            Parent Registration & Authorisation Form
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Adobe handles the signature. TAA tracks the request and the signed
            status until API automation is worthwhile.
          </p>
        </div>
        <Badge variant={status === "signed" ? "default" : "secondary"}>
          {statusLabel(status)}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Last sent
          </p>
          <p className="mt-1">{record?.sent_at ? formatTimestamp(record.sent_at) : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email delivery
          </p>
          <p className="mt-1">
            {deliveryLabel(delivery?.status) || "—"}
            {deliveryTime ? " · " + formatTimestamp(deliveryTime) : ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Signed
          </p>
          <p className="mt-1">{record?.signed_at ? formatTimestamp(record.signed_at) : "—"}</p>
        </div>
      </div>

      {delivery?.delivery_detail || delivery?.error_message ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {delivery.delivery_detail || delivery.error_message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-end gap-3">
        {status !== "signed" ? (
          <form action={sendRegistrationAuthorisationForm}>
            <input name="parentLeadId" type="hidden" value={parentLeadId} />
            <Button type="submit" variant={status === "sent" ? "outline" : "default"}>
              {status === "sent" ? "Send again" : "Send form"}
            </Button>
          </form>
        ) : null}

        <a
          className="inline-flex h-10 items-center rounded-md border bg-background px-4 text-sm font-semibold hover:bg-muted"
          href={REGISTRATION_AUTHORISATION_FORM_URL}
          rel="noreferrer"
          target="_blank"
        >
          Open Adobe form
        </a>

        {status !== "signed" ? (
          <form action={markRegistrationAuthorisationSigned} className="flex flex-wrap items-end gap-2">
            <input name="parentLeadId" type="hidden" value={parentLeadId} />
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Signed date
              <Input defaultValue={today} max={today} name="signedOn" required type="date" />
            </label>
            <Button type="submit" variant="secondary">
              Mark as signed
            </Button>
          </form>
        ) : null}
      </div>

      {record?.send_count ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Sent from TAA {record.send_count} time{record.send_count === 1 ? "" : "s"}.
        </p>
      ) : null}
    </section>
  )
}
