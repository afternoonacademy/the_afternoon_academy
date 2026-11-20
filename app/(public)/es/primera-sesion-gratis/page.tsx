import { FreeFirstSessionPage, freeFirstSessionMetadata } from "@/components/shared/free-first-session"

export const dynamic = "force-dynamic"

export const metadata = freeFirstSessionMetadata("es")

export default function Page() {
  return <FreeFirstSessionPage locale="es" />
}
