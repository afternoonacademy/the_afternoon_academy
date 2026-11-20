import type { Metadata } from "next"
import Image from "next/image"

import { LeadForm } from "@/components/forms/lead-form"
import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Card, CardContent } from "@/components/ui/card"
import { loadMarketingPartners } from "@/lib/leads/marketing-partners"
import { freeTrialPaths } from "@/lib/leads/free-trial.mjs"

const copy = {
  en: {
    title: "Free first learning session in Madrid",
    description: "Request a free first learning session in Arturo Soria, Madrid. We welcome pupils from all school systems and offer homework support and subject Focus Groups.",
    headline: "Try your first session free",
    intro: "At The Afternoon Academy, qualified teachers help pupils from Spanish, British and other international school systems. Our Homework Club offers small-group support with homework, reading, writing and maths. Our subject Focus Groups offer more targeted help, starting with IGCSE Chemistry for Years 10 and 11.",
    details: "After school, Monday to Friday. Calle Asura 40, Arturo Soria, 28043 Madrid.",
    heading: "What happens in the first session?",
    explanation: "Tell us what your child is working on and where they could use help. We’ll talk through their schoolwork or subject with you and confirm a suitable group session, subject to availability.",
    terms: "Open to new families. The first group session is free, subject to a suitable place being available. You can decide afterwards whether to continue.",
    button: "Request a free session",
    image: "The Afternoon Academy classroom in Arturo Soria",
  },
  es: {
    title: "Primera sesión de apoyo escolar gratis en Madrid",
    description: "Solicita una primera sesión gratuita en Arturo Soria, Madrid. Ofrecemos apoyo escolar y grupos por asignatura para alumnado de cualquier sistema educativo.",
    headline: "Prueba tu primera sesión gratis",
    intro: "En The Afternoon Academy, docentes cualificados apoyan a alumnado del sistema español, británico y otros sistemas internacionales. En el Homework Club trabajamos los deberes, la lectura, la escritura y las matemáticas en grupos reducidos. También ofrecemos grupos de refuerzo por asignatura. El primero es Química IGCSE para Years 10 y 11.",
    details: "Después del colegio, de lunes a viernes. Calle Asura 40, Arturo Soria, 28043 Madrid.",
    heading: "¿Cómo es la primera sesión?",
    explanation: "Cuéntanos qué está estudiando tu hijo o hija y en qué necesita ayuda. Hablaremos con vosotros sobre sus deberes o la asignatura y confirmaremos una sesión en un grupo adecuado, según la disponibilidad.",
    terms: "Oferta abierta a todas las familias nuevas. La primera sesión en grupo es gratuita y está sujeta a disponibilidad en un grupo adecuado. Después podréis decidir si queréis continuar.",
    button: "Solicitar una sesión gratuita",
    image: "Aula de The Afternoon Academy en Arturo Soria",
  },
}

type Locale = keyof typeof copy

export function freeFirstSessionMetadata(locale: Locale): Metadata {
  const { title, description } = copy[locale]
  return {
    title,
    description,
    alternates: { canonical: freeTrialPaths[locale], languages: freeTrialPaths },
  }
}

export async function FreeFirstSessionPage({ locale }: { locale: Locale }) {
  const { data: partners } = await loadMarketingPartners()
  const t = copy[locale]
  const switchHref = freeTrialPaths[locale === "es" ? "en" : "es"]

  return (
    <main className="min-h-screen" lang={locale}>
      <PublicHeader locale={locale} switchHref={switchHref} />
      <div className="brand-shell space-y-10 py-10 md:space-y-14 md:py-16">
        <section className="brand-hero grid items-center gap-8 p-6 md:p-10 lg:grid-cols-2">
          <div className="space-y-5">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t.headline}</h1>
            <p className="text-lg brand-muted">{t.intro}</p>
            <p className="text-sm font-medium">{t.details}</p>
            <a className="brand-button" href="#apply">{t.button}</a>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image src="/classroom-1.jpg" alt={t.image} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
          </div>
        </section>
        <section id="apply" className="scroll-mt-10">
          <Card className="brand-form-panel">
            <CardContent className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,320px)_1fr]">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">{t.heading}</h2>
                <p className="brand-muted">{t.explanation}</p>
                <p className="text-sm brand-muted">{t.terms}</p>
              </div>
              <LeadForm language={locale} freeTrial marketingPartners={(partners ?? []).map(({ id, name }) => ({ id, name }))} />
            </CardContent>
          </Card>
        </section>
      </div>
      <PublicFooter locale={locale} switchHref={switchHref} />
    </main>
  )
}
