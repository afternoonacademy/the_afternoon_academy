import Link from "next/link";

import { logout } from "@/actions/auth";
import { requireAdmin } from "@/lib/auth/require-admin";

const navItems = [
  {
    href: "/admin",
    label: "Today",
  },
  {
    href: "/admin/leads",
    label: "Leads",
  },
  {
    href: "/admin/learners",
    label: "Learners",
  },
  {
    href: "/admin/tutor-room",
    label: "Tutor Room",
  },
  { href: "/admin/setup", label: "Academy setup" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { internalUser } = await requireAdmin();

  return (
    <main className="min-h-screen bg-muted/30 md:flex">
      <aside className="flex border-b bg-background p-4 md:min-h-screen md:w-64 md:flex-col md:border-r md:border-b-0">
        <div className="mb-5">
          <p className="brand-kicker">The Afternoon Academy</p>
          <h1 className="mt-1 text-xl font-bold">Admin</h1>
        </div>
        <nav className="flex flex-1 gap-2 overflow-x-auto md:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t pt-4 text-sm">
          <p className="truncate text-muted-foreground">{internalUser.email}</p>
          <form action={logout} className="mt-2">
            <button className="text-sm font-medium text-primary" type="submit">
              Log out
            </button>
          </form>
        </div>
      </aside>
      <section className="min-w-0 flex-1 p-4 md:p-8">{children}</section>
    </main>
  );
}
