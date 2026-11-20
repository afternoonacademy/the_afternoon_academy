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
    guide: "Family Guides",
    guideHref: "/guide",
    location: "Location",
    timetable: "Apply for a place",
    cta: "Apply for a place",
    staffLogin: "Staff login",
    socials: "Follow us",
    newTab: "opens in a new tab",
    switchLabel: "Español",
    defaultSwitchHref: "/es",
    contactHref: "/contact",
    locationHref: "/location",
    timetableHref: "/#apply",
  },
  es: {
    homeHref: "/es",
    brand: "The Afternoon Academy",
    tagline: "Apoyo académico en inglés para familias en Madrid.",
    home: "Inicio",
    contact: "Contacto",
    guide: "Guías para familias",
    guideHref: "/es/guia",
    location: "Ubicación",
    timetable: "Solicita una plaza",
    cta: "Solicita una plaza",
    staffLogin: "Acceso equipo",
    socials: "Síguenos",
    newTab: "se abre en una pestaña nueva",
    switchLabel: "English",
    defaultSwitchHref: "/",
    contactHref: "/es/contact",
    locationHref: "/es/ubicacion",
    timetableHref: "/es#apply",
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
          <Link href={t.guideHref} className="text-sm font-medium text-muted-foreground hover:text-foreground">{t.guide}</Link>

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
          <nav aria-label={t.socials} className="flex items-center gap-2 pt-1">
            <a
              href="https://www.facebook.com/profile.php?id=61595604354227"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Facebook (${t.newTab})`}
              title="Facebook"
              className="inline-flex size-11 items-center justify-center rounded-full border transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/theafternoonacademy/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram (${t.newTab})`}
              title="Instagram"
              className="inline-flex size-11 items-center justify-center rounded-full border transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </nav>
        </div>

        <nav className="flex flex-wrap gap-4">
          <Link href={t.homeHref} className="hover:text-foreground">
            {t.home}
          </Link>
          <Link href={t.guideHref} className="text-sm font-medium text-muted-foreground hover:text-foreground">{t.guide}</Link>

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
