import Link from "next/link"

import { Button } from "@/components/ui/button"

type Locale = "en" | "es"

const copy = {
  en: {
    homeHref: "/",
    brand: "The Afternoon Academy",
    tagline: "British curriculum support for children in Madrid.",
    contact: "Contact",
    timetable: "Timetable form",
    cta: "Help shape the timetable",
    staffLogin: "Staff login",
    switchLabel: "Español",
    switchHref: "/es",
    contactHref: "/contact",
    timetableHref: "/#timetable-form",
  },
  es: {
    homeHref: "/es",
    brand: "The Afternoon Academy",
    tagline: "Apoyo académico en inglés para familias en Madrid.",
    contact: "Contacto",
    timetable: "Formulario de horarios",
    cta: "Ayúdanos a organizar los horarios",
    staffLogin: "Acceso equipo",
    switchLabel: "English",
    switchHref: "/",
    contactHref: "/es/contact",
    timetableHref: "/es#timetable-form",
  },
}

export function PublicHeader({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale]

  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={t.homeHref} className="font-semibold tracking-tight">
          {t.brand}
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href={t.contactHref}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t.contact}
          </Link>

          <Link
            href={t.switchHref}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t.switchLabel}
          </Link>

          <Button asChild size="sm">
            <Link href={t.timetableHref}>{t.cta}</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

export function PublicFooter({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale]

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-foreground">{t.brand}</p>
          <p>{t.tagline}</p>
        </div>

        <nav className="flex flex-wrap gap-4">
          <Link href={t.contactHref} className="hover:text-foreground">
            {t.contact}
          </Link>

          <Link href={t.timetableHref} className="hover:text-foreground">
            {t.timetable}
          </Link>

          <Link href="/sign-in" className="hover:text-foreground">
            {t.staffLogin}
          </Link>
        </nav>
      </div>
    </footer>
  )
}