import Image from "next/image"
import Link from "next/link"
import { Clock, MapPin, School, Sparkles, Users } from "lucide-react"

import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Location",
  description:
    "See the confirmed location for The Afternoon Academy in the Arturo Soria area of Madrid.",
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
    title: "Accessible local area",
    description:
      "A convenient location for families around Arturo Soria, Calle Asura and nearby international school routes.",
    icon: MapPin,
  },
  {
    title: "Designed for learning",
    description:
      "The space is being prepared for calm, focused academic support after school.",
    icon: School,
  },
  {
    title: "Small-group setup",
    description:
      "The planned layout supports small learning pods rather than a large, busy classroom feel.",
    icon: Users,
  },
  {
    title: "After-school routine",
    description:
      "The location supports a simple arrival, session and collection routine for families.",
    icon: Clock,
  },
]

const gallery = [
  {
    src: "/main_frontage.png",
    title: "Location frontage",
    description:
      "The outside of the building so families can recognise where The Afternoon Academy will be based.",
  },
  {
    src: "/classroom_proposal.png",
    title: "Classroom concept",
    description:
      "A visual direction for the calm, structured learning space we are preparing for launch.",
  },
]

export default function LocationPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader locale="en" switchHref="/es/ubicacion" />

      <section className="brand-shell flex flex-col gap-12 py-10 md:py-16">
        <section className="brand-hero grid gap-10 p-6 md:p-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="space-y-6">
            <div className="brand-pill">Confirmed location</div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                A calm, accessible space in Arturo Soria.
              </h1>

              <p className="max-w-2xl text-lg brand-muted md:text-xl">
                The Afternoon Academy will be based at Calle Asura 40 in the
                Arturo Soria area, with a setup designed for small-group
                academic support after school.
              </p>
            </div>

            <div className="rounded-3xl border bg-white/60 p-5">
              <p className="brand-kicker">Address</p>

              <h2 className="mt-2 text-2xl font-semibold">
                Calle Asura 40, Arturo Soria, Madrid
              </h2>

              <p className="mt-2 text-sm brand-muted">
                This will be our home for launch. Full arrival details will be
                shared with families before opening so drop-off and collection
                are clear and simple.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/#timetable-form">
                    Help shape the timetable
                  </Link>
                </Button>

                <Button asChild variant="outline">
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                    Open in Google Maps
                  </a>
                </Button>

                <Button asChild variant="outline">
                  <Link href="/contact">Ask a question</Link>
                </Button>
              </div>
            </div>
          </div>

          <Card className="brand-card overflow-hidden">
            <div className="relative aspect-4/3 w-full">
              <Image
                src="/main_frontage.png"
                alt="Location frontage for The Afternoon Academy"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
              />
            </div>

            <CardContent className="space-y-2 p-5">
              <h2 className="font-semibold">Location frontage</h2>

              <p className="text-sm brand-muted">
                A clear view of the outside of the building to help families
                recognise where The Afternoon Academy will be based.
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
                <p className="brand-kicker">Find us</p>

                <h2 className="text-3xl font-bold tracking-tight">
                  Calle Asura 40, Arturo Soria
                </h2>

                <p className="brand-muted">
                  The Afternoon Academy will be based at Calle Asura 40 in the
                  Arturo Soria area of Madrid. This page will help families
                  recognise the frontage and find the location before launch.
                </p>
              </div>

              <Button asChild variant="outline">
                <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                  Open in Google Maps
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
                  <p className="text-sm font-semibold">Map location</p>
                  <p className="text-xs brand-muted">
                    Calle Asura 40, Arturo Soria, Madrid
                  </p>
                </div>
              </div>
            </div>

            <div className="h-80 w-full md:h-95">
              <iframe
                title="Google Map showing Calle Asura 40, Arturo Soria, Madrid"
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
            <p className="brand-kicker">Why this location works</p>

            <h2 className="text-3xl font-bold tracking-tight">
              Practical, calm and suitable for small-group learning
            </h2>

            <p className="brand-muted">
              This location supports the kind of structured after-school routine
              families need: easy to find, focused, and suitable for small
              learning groups.
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
            <p className="brand-kicker">Look and feel</p>

            <h2 className="text-3xl font-bold tracking-tight">
              A space planned around calm, structure and focus
            </h2>

            <p className="brand-muted">
              These images show the confirmed frontage and the visual direction
              for the classroom space as we prepare for launch. Final classroom
              details may change as the room is set up, but the aim is a calm,
              organised environment where children can focus after school.
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
            Want to help shape the first timetable?
          </h2>

          <p className="mx-auto mt-2 max-w-2xl brand-muted">
            Tell us which days, times and types of support would work best for
            your family. There is no payment or commitment at this stage.
          </p>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/#timetable-form" className="brand-button">
              Share timetable preferences
            </Link>

            <Link href="/contact" className="brand-button-secondary">
              Contact us
            </Link>
          </div>
        </section>
      </section>

      <PublicFooter locale="en" switchHref="/es/ubicacion" />
    </main>
  )
}