import Link from "next/link"

import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Gracias",
  description:
    "Gracias por enviar tu solicitud de plaza a The Afternoon Academy.",
}

export default function SpanishLeadThanksPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader locale="es" switchHref="/thank-you" />

      <section className="mx-auto flex max-w-3xl px-6 py-16 md:py-24">
        <Card className="brand-card w-full">
          <CardContent className="space-y-5 p-8 text-center">
            <div className="brand-pill mx-auto w-fit">
              Solicitud recibida
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Hemos recibido tu solicitud de plaza
            </h1>

            <p className="brand-muted">
              Hemos recibido tu solicitud de plaza para las sesiones de
              lanzamiento en Calle Asura 40, Arturo Soria.
            </p>

            <p className="brand-muted">
              Esto no confirma una plaza todavía. Revisaremos tu solicitud y te
              contactaremos para confirmar disponibilidad y próximos pasos.
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
