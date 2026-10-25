"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

import { logout } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { mobileAdminNavigationConfig } from "@/lib/admin/admin-navigation.mjs"
import { cn } from "@/lib/utils"

type AdminNavItem = { href: string; label: string; capability?: string }

export function AdminMobileNavigation({
  email,
  items,
}: {
  email: string
  items: AdminNavItem[]
}) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-indigo-100 bg-[#fffdf5]/95 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5170ff]">
            The Afternoon Academy
          </p>
          <p className="text-lg font-bold leading-tight text-[#26345f]">
            Operations
          </p>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              aria-label="Open admin menu"
              className="h-11 min-w-11 rounded-full border-indigo-100 bg-white px-3 text-[#26345f] shadow-sm"
              type="button"
              variant="outline"
            >
              <Menu className="size-5" />
              <span className="ml-1 text-sm font-semibold">Menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent
            className="mobile-scroll-surface w-[86vw] max-w-[22rem] overflow-y-auto bg-[#fffdf5] p-0"
            side={mobileAdminNavigationConfig.side as "left" | "top" | "right" | "bottom"}
            showCloseButton={false}
          >
            <SheetHeader className="relative border-b border-indigo-100 bg-[#26345f] px-5 pb-5 pr-16 pt-[max(1.25rem,env(safe-area-inset-top))] text-left">
              <SheetClose asChild>
                <button
                  aria-label="Close admin menu"
                  className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-95"
                  type="button"
                >
                  <X className="size-5" />
                </button>
              </SheetClose>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-200">
                The Afternoon Academy
              </p>
              <SheetTitle className="mt-1 text-2xl font-bold text-white">
                Operations
              </SheetTitle>
              <SheetDescription className="text-sm leading-5 text-indigo-100">
                Navigate the Academy admin area.
              </SheetDescription>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Admin navigation">
              {items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href)

                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center rounded-2xl px-4 py-3 text-base font-semibold transition active:scale-[0.99]",
                        active
                          ? "bg-[#26345f] text-white shadow-sm"
                          : "text-[#26345f] hover:bg-[#fff1aa]",
                      )}
                      href={item.href}
                      prefetch={false}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                )
              })}
            </nav>

            <div className="mt-auto border-t border-indigo-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <p className="truncate text-sm text-muted-foreground">{email}</p>
              <form action={logout} className="mt-3">
                <button
                  className="min-h-11 text-sm font-semibold text-primary"
                  type="submit"
                >
                  Log out
                </button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
