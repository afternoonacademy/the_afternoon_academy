import Link from "next/link"

import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Mensaje recibido",
  description: "Hemos recibido tu mensaje.",
}

export default function SpanishContactThanksPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader locale="es" />

      <section className="mx-auto flex max-w-3xl px-6 py-16 md:py-24">
        <Card className="brand-card w-full">
          <CardContent className="space-y-5 p-8 text-center">
            <div className="brand-pill mx-auto w-fit">Mensaje recibido</div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Gracias por contactar con nosotros
            </h1>

            <p className="brand-muted">
              Hemos recibido tu mensaje y te responderemos lo antes posible.
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/es" className="brand-button">
                Volver al inicio
              </Link>

              <Link href="/es#timetable-form" className="brand-button-secondary">
                Formulario de horarios
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <PublicFooter locale="es" />
    </main>
  )
}