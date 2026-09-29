import Link from "next/link";

import { logout } from "@/actions/auth";
import { requireAdmin } from "@/lib/auth/require-admin";

const navItems = [
  {
    href: "/admin",
    label: "Operations hub",
  },
  {
    href: "/admin/leads",
    label: "Family pipeline",
  },
  {
    href: "/admin/renewals",
    label: "Renewals",
  },
  {
    href: "/admin/learners",
    label: "Learner records",
  },
  {
    href: "/admin/family-updates",
    label: "Family updates",
  },
  {
    href: "/admin/tutor-room",
    label: "One-to-one room",
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
      <aside className="flex border-b border-indigo-100 bg-[#fffdf5]/90 p-4 backdrop-blur md:min-h-screen md:w-72 md:flex-col md:border-r md:border-b-0">
        <div className="mb-6 rounded-2xl bg-[#26345f] p-4 text-white shadow-lg shadow-indigo-950/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200">The Afternoon Academy</p>
          <h1 className="mt-1 text-xl font-bold text-white">Operations</h1>
          <p className="mt-1 text-xs text-indigo-100">A calm, human view of every child’s journey.</p>
        </div>
        <nav className="flex flex-1 gap-2 overflow-x-auto md:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-[#fff1aa]"
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
