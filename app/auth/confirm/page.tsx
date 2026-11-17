import { StaffLinkConfirmation } from "@/components/auth/StaffLinkConfirmation"

export const dynamic = "force-dynamic"
export const metadata = { title: "Confirm staff sign-in", robots: { index: false, follow: false }, referrer: "no-referrer" as const }
export default function StaffConfirmationPage() {
  return <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6"><StaffLinkConfirmation /></main>
}
