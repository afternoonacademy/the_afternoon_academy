"use client"

import { useState } from "react"

import {
  FamilyCommunications,
  type FamilyCommunication,
} from "@/components/admin/family-communications"
import { Button } from "@/components/ui/button"

export function FamilyEmailHistory({
  initialItems,
  initialHasMore,
  initialNextCursor,
  initialError = "",
  parentLeadId,
}: {
  initialItems: FamilyCommunication[]
  initialHasMore: boolean
  initialNextCursor: string | null
  initialError?: string
  parentLeadId: string
}) {
  const [items, setItems] = useState(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)

  async function loadPage(replaceItems = false) {
    if (loading) return
    if (!replaceItems && !nextCursor) return

    setLoading(true)
    setError("")

    try {
      const query = !replaceItems && nextCursor
        ? `?cursor=${encodeURIComponent(nextCursor)}`
        : ""
      const response = await fetch(`/api/admin/families/${parentLeadId}/emails${query}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load family emails")

      if (replaceItems) setItems(data.items)
      else setItems((current) => [...current, ...data.items])
      setHasMore(Boolean(data.hasMore))
      setNextCursor(data.nextCursor || null)
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not load family emails")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Email history</h3>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            Recorded Academy email history for this family. Delivery status is tracked;
            open and click tracking are not used.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{items.length} loaded</span>
      </div>

      <div className="mt-3 max-h-[32rem] overflow-y-auto rounded-lg border bg-background">
        <FamilyCommunications
          communications={items}
          emptyLabel="No recorded Academy emails for this family yet."
          showHeader={false}
        />
      </div>

      {error ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button onClick={() => loadPage(items.length === 0)} size="sm" type="button" variant="outline">
            Retry
          </Button>
        </div>
      ) : null}

      {hasMore && !error ? (
        <div className="mt-3 flex justify-center">
          <Button disabled={loading} onClick={() => loadPage(false)} type="button" variant="outline">
            {loading ? "Loading…" : "Load older emails"}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
