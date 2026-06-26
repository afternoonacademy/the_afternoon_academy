import Image from "next/image"
import Link from "next/link"
import { Clock, MapPin, School, Sparkles, Users } from "lucide-react"

import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Ubicación",
  description:
    "Consulta la ubicación confirmada de The Afternoon Academy en la zona de Arturo Soria, Madrid.",
}

const address = "Calle Asura 40, Arturo Soria, Madrid"

const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  address
)}`

const googleMapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  address
)}&output=embed`

const features = [
  {
    title: "Zona local accesible",
    description:
      "Una ubicación cómoda para familias de Arturo Soria, Calle Asura y rutas cercanas de colegios internacionales.",
    icon: MapPin,
  },
  {
    title: "Diseñado para aprender",
    description:
      "El espacio se está preparando para ofrecer apoyo académico tranquilo y enfocado después del colegio.",
    icon: School,
  },
  {
    title: "Grupos reducidos",
    description:
      "La distribución prevista favorece pequeños grupos de aprendizaje en lugar de una clase grande y demasiado concurrida.",
    icon: Users,
  },
  {
    title: "Rutina extraescolar",
    description:
      "La ubicación permite una rutina sencilla de llegada, sesión y recogida para las familias.",
    icon: Clock,
  },
]

const gallery = [
  {
    src: "/main_frontage.png",
    title: "Fachada de la ubicación",
    description:
      "El exterior del edificio para que las familias puedan reconocer dónde estará The Afternoon Academy.",
  },
  {
    src: "/classroom_proposal.png",
    title: "Concepto de aula",
    description:
      "Una dirección visual del espacio tranquilo y estructurado que estamos preparando para la apertura.",
  },
]

export default function SpanishLocationPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader locale="es" switchHref="/location" />

      <section className="brand-shell flex flex-col gap-12 py-10 md:py-16">
        <section className="brand-hero grid gap-10 p-6 md:p-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="space-y-6">
            <div className="brand-pill">Ubicación confirmada</div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                Un espacio tranquilo y accesible en Arturo Soria.
              </h1>

              <p className="max-w-2xl text-lg brand-muted md:text-xl">
                The Afternoon Academy estará en Calle Asura 40, en la zona de
                Arturo Soria, con un espacio diseñado para apoyo académico en
                grupos reducidos después del colegio.
              </p>
            </div>

            <div className="rounded-3xl border bg-white/60 p-5">
              <p className="brand-kicker">Dirección</p>

              <h2 className="mt-2 text-2xl font-semibold">
                Calle Asura 40, Arturo Soria, Madrid
              </h2>

              <p className="mt-2 text-sm brand-muted">
                Esta será nuestra ubicación para la apertura. Compartiremos los
                detalles de llegada con las familias antes de abrir para que la
                entrada, salida y recogida sean claras y sencillas.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/es#timetable-form">
                    Ayúdanos a organizar los horarios
                  </Link>
                </Button>

                <Button asChild variant="outline">
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                    Abrir en Google Maps
                  </a>
                </Button>

                <Button asChild variant="outline">
                  <Link href="/es/contact">Hacer una pregunta</Link>
                </Button>
              </div>
            </div>
          </div>

          <Card className="brand-card overflow-hidden">
            <div className="relative h-90 w-full md:h-105 lg:h-115">
              <Image
                src="/main_frontage.png"
                alt="Fachada de la ubicación de The Afternoon Academy"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
              />
            </div>

            <CardContent className="space-y-2 p-5">
              <h2 className="font-semibold">Fachada de la ubicación</h2>

              <p className="text-sm brand-muted">
                Una vista clara del exterior del edificio para ayudar a las
                familias a reconocer dónde estará The Afternoon Academy.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <Card className="brand-card">
            <CardContent className="space-y-5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-white/70">
                <MapPin className="h-5 w-5" />
              </div>

              <div className="space-y-2">
                <p className="brand-kicker">Dónde encontrarnos</p>

                <h2 className="text-3xl font-bold tracking-tight">
                  Calle Asura 40, Arturo Soria
                </h2>

                <p className="brand-muted">
                  The Afternoon Academy estará en Calle Asura 40, en la zona de
                  Arturo Soria, Madrid. Esta página ayudará a las familias a
                  reconocer la fachada y encontrar la ubicación antes de la
                  apertura.
                </p>
              </div>

              <Button asChild variant="outline">
                <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                  Abrir en Google Maps
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="brand-card overflow-hidden">
            <div className="border-b bg-white/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-white">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold">Ubicación en el mapa</p>
                  <p className="text-xs brand-muted">
                    Calle Asura 40, Arturo Soria, Madrid
                  </p>
                </div>
              </div>
            </div>

            <div className="h-80 w-full md:h-95">
              <iframe
                title="Mapa de Google mostrando Calle Asura 40, Arturo Soria, Madrid"
                src={googleMapsEmbedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="brand-kicker">Por qué funciona esta ubicación</p>

            <h2 className="text-3xl font-bold tracking-tight">
              Práctica, tranquila y adecuada para grupos reducidos
            </h2>

            <p className="brand-muted">
              Esta ubicación favorece la rutina extraescolar estructurada que
              muchas familias necesitan: fácil de encontrar, enfocada y adecuada
              para pequeños grupos de aprendizaje.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <Card key={feature.title} className="brand-card">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-white/70">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">{feature.title}</h3>

                      <p className="text-sm brand-muted">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="brand-kicker">Aspecto y ambiente</p>

            <h2 className="text-3xl font-bold tracking-tight">
              Un espacio pensado para la calma, la estructura y la concentración
            </h2>

            <p className="brand-muted">
              Estas imágenes muestran la fachada confirmada y la dirección
              visual del aula mientras preparamos la apertura. Los detalles
              finales del aula pueden cambiar a medida que se acondicione el
              espacio, pero el objetivo es crear un entorno tranquilo,
              organizado y adecuado para que los niños puedan concentrarse
              después del colegio.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {gallery.map((item) => (
              <Card key={item.title} className="brand-card overflow-hidden">
                <div className="relative aspect-4/3 w-full bg-muted">
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>

                <CardContent className="space-y-2 p-5">
                  <h3 className="font-semibold">{item.title}</h3>

                  <p className="text-sm brand-muted">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border bg-white/60 p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6" />

          <h2 className="mt-3 text-2xl font-semibold">
            ¿Quieres ayudarnos a organizar el primer horario?
          </h2>

          <p className="mx-auto mt-2 max-w-2xl brand-muted">
            Indícanos qué días, horarios y tipos de apoyo funcionarían mejor
            para tu familia. No hay pago ni compromiso en esta fase.
          </p>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/es#timetable-form" className="brand-button">
              Compartir preferencias de horario
            </Link>

            <Link href="/es/contact" className="brand-button-secondary">
              Contactar
            </Link>
          </div>
        </section>
      </section>

      <PublicFooter locale="es" switchHref="/location" />
    </main>
  )
}