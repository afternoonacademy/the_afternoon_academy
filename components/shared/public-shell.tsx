import Link from "next/link"

import { Button } from "@/components/ui/button"

export function PublicHeader() {
  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          The Afternoon Academy
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Contact
          </Link>

          <Button asChild size="sm">
            <Link href="/#timetable-form">Help shape the timetable</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-foreground">The Afternoon Academy</p>
          <p>British curriculum support for children in Madrid.</p>
        </div>

        <nav className="flex flex-wrap gap-4">
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>

          <Link href="/#timetable-form" className="hover:text-foreground">
            Timetable form
          </Link>

          <Link href="/sign-in" className="hover:text-foreground">
            Staff login
          </Link>
        </nav>
      </div>
    </footer>
  )
}