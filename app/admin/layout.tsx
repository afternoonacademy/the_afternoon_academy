import Link from "next/link"

import { logout } from "@/actions/auth"
import { requireAdmin } from "@/lib/auth/require-admin"

const navItems = [
  {
    href: "/admin",
    label: "Overview",
  },
  {
    href: "/admin/leads",
    label: "Leads",
  },
  {
    href: "/admin/trends",
    label: "Trends",
  },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { internalUser } = await requireAdmin()

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              The Afternoon Academy
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Admin dashboard
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Signed in as {internalUser.email}
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}

            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">{children}</section>
    </main>
  )
}
