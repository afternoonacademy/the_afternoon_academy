import { FreeFirstSessionPage, freeFirstSessionMetadata } from "@/components/shared/free-first-session"

export const dynamic = "force-dynamic"

export const metadata = freeFirstSessionMetadata("en")

export default function Page() {
  return <FreeFirstSessionPage locale="en" />
}
