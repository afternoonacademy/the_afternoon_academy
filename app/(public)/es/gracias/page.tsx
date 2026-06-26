import Link from "next/link"

import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Gracias",
  description:
    "Gracias por compartir tus preferencias de horario con The Afternoon Academy.",
}

export default function SpanishLeadThanksPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader locale="es" switchHref="/thank-you" />

      <section className="mx-auto flex max-w-3xl px-6 py-16 md:py-24">
        <Card className="brand-card w-full">
          <CardContent className="space-y-5 p-8 text-center">
            <div className="brand-pill mx-auto w-fit">
              Preferencias recibidas
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Gracias por ayudarnos a organizar el horario
            </h1>

            <p className="brand-muted">
              Hemos recibido tus preferencias. Las usaremos para entender qué
              días, horarios y tipos de apoyo tienen más demanda antes de la
              apertura.
            </p>

            <p className="brand-muted">
              Esto no confirma una plaza todavía. Te contactaremos cuando
              tengamos más información sobre disponibilidad y próximos pasos.
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/es" className="brand-button">
                Volver al inicio
              </Link>

              <Link href="/es/contact" className="brand-button-secondary">
                Contactar
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <PublicFooter locale="es" switchHref="/thank-you" />
    </main>
  )
}