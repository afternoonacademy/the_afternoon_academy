import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

type Locale = "en" | "es"

const copy = {
  en: {
    homeHref: "/",
    brand: "The Afternoon Academy",
    tagline: "British curriculum support for children in Madrid.",
    home: "Home",
    contact: "Contact",
    location: "Location",
    timetable: "Timetable form",
    cta: "Help shape the timetable",
    staffLogin: "Staff login",
    switchLabel: "Español",
    defaultSwitchHref: "/es",
    contactHref: "/contact",
    locationHref: "/location",
    timetableHref: "/#timetable-form",
  },
  es: {
    homeHref: "/es",
    brand: "The Afternoon Academy",
    tagline: "Apoyo académico en inglés para familias en Madrid.",
    home: "Inicio",
    contact: "Contacto",
    location: "Ubicación",
    timetable: "Formulario de horarios",
    cta: "Organizar horarios",
    staffLogin: "Acceso equipo",
    switchLabel: "English",
    defaultSwitchHref: "/",
    contactHref: "/es/contact",
    locationHref: "/es/ubicacion",
    timetableHref: "/es#timetable-form",
  },
}

export function PublicHeader({
  locale = "en",
  switchHref,
}: {
  locale?: Locale
  switchHref?: string
}) {
  const t = copy[locale]
  const languageHref = switchHref ?? t.defaultSwitchHref

  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-4 md:flex-row md:justify-between">
        <Link href={t.homeHref} className="flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="The Afternoon Academy"
            width={600}
            height={200}
            priority
            className="h-12 w-auto"
          />
        </Link>

        <nav className="flex w-full flex-wrap items-center justify-center gap-3 md:w-auto md:justify-end">
          <Link
            href={t.homeHref}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t.home}
          </Link>

          <Link
            href={t.contactHref}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t.contact}
          </Link>

          <Link
            href={t.locationHref}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t.location}
          </Link>

          <Link
            href={languageHref}
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

export function PublicFooter({
  locale = "en",
  switchHref,
}: {
  locale?: Locale
  switchHref?: string
}) {
  const t = copy[locale]
  const languageHref = switchHref ?? t.defaultSwitchHref

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link href={t.homeHref} className="inline-flex items-center">
            <Image
              src="/logo.png"
              alt="The Afternoon Academy"
              width={150}
              height={50}
              className="h-10 w-auto"
            />
          </Link>

          <p>{t.tagline}</p>
        </div>

        <nav className="flex flex-wrap gap-4">
          <Link href={t.homeHref} className="hover:text-foreground">
            {t.home}
          </Link>

          <Link href={t.contactHref} className="hover:text-foreground">
            {t.contact}
          </Link>

          <Link href={t.locationHref} className="hover:text-foreground">
            {t.location}
          </Link>

          <Link href={t.timetableHref} className="hover:text-foreground">
            {t.timetable}
          </Link>

          <Link href={languageHref} className="hover:text-foreground">
            {t.switchLabel}
          </Link>

          <Link href="/sign-in" className="hover:text-foreground">
            {t.staffLogin}
          </Link>
        </nav>
      </div>
    </footer>
  )
}