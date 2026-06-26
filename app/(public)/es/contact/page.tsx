import Link from "next/link"

import { ContactForm } from "@/components/forms/contact-form"
import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Contacto",
  description:
    "Contacta con The Afternoon Academy para preguntas sobre apoyo académico extraescolar en Madrid.",
}

export default function SpanishContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader locale="es" switchHref="/contact" />

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border px-4 py-2 text-sm text-muted-foreground">
            Contacto
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              ¿Tienes alguna pregunta antes de registrar tu interés?
            </h1>

            <p className="text-lg text-muted-foreground">
              Escríbenos si quieres preguntar por edades, apoyo académico,
              ubicación, clases privadas, hermanos o cualquier otra cuestión
              antes de completar el formulario de horarios.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-5">
            <h2 className="font-semibold">¿Buscas el formulario de horarios?</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Si ya estás interesado/a, lo más útil es que compartas tus días y
              horarios preferidos en la página principal.
            </p>

            <Button asChild className="mt-4">
              <Link href="/es#timetable-form">
                Compartir días y horarios preferidos
              </Link>
            </Button>
          </div>
        </div>

        <ContactForm language="es" />
      </section>

      <PublicFooter locale="es" switchHref="/contact" />
    </main>
  )
}