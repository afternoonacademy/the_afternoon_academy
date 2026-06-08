import Link from "next/link"

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Admin protection is not enabled yet. We will add Supabase Auth before
          deployment.
        </div>

        {children}
      </section>
    </main>
  )
}