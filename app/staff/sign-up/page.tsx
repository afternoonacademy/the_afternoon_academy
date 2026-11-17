import { StaffSignupForm } from "@/components/auth/StaffSignupForm"

export const metadata = { title: "Staff signup | The Afternoon Academy", robots: { index: false, follow: false } }
export default function StaffSignupPage() {
  return <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6"><StaffSignupForm /></main>
}
