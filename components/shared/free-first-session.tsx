import type { Metadata } from "next"
import Image from "next/image"

import { LeadForm } from "@/components/forms/lead-form"
import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Card, CardContent } from "@/components/ui/card"
import { loadMarketingPartners } from "@/lib/leads/marketing-partners"
import { freeTrialPaths } from "@/lib/leads/free-trial.mjs"

const copy = {
  en: {
    title: "Free first homework support session in Madrid",
    description: "Try a free first session of English-language homework support for ages 4–12 in Arturo Soria, Madrid. Request a place in a small group.",
    headline: "Try your first homework support session free",
    intro: "Give your child a calm place to work through homework in English. At The Afternoon Academy, qualified teachers help children aged 4–12 with homework, reading, writing and maths in small groups.",
    details: "After school, Monday to Friday. Calle Asura 40, Arturo Soria, 28043 Madrid.",
    heading: "What happens in the first session?",
    explanation: "Bring schoolwork or tell us what your child finds tricky. We’ll help them choose a task, work through it with a teacher nearby and work out what to try next.",
    terms: "Open to new families. The first group session is free, subject to a suitable place being available. You can decide afterwards whether to continue.",
    button: "Request a free session",
    image: "The Afternoon Academy classroom in Arturo Soria",
  },
  es: {
    title: "Primera sesión gratis de apoyo escolar en inglés en Madrid",
    description: "Prueba una primera sesión gratuita de apoyo escolar en inglés para niños de 4 a 12 años en Arturo Soria, Madrid. Solicita una plaza en un grupo reducido.",
    headline: "Primera sesión gratis de apoyo escolar en inglés",
    intro: "Un espacio tranquilo para que tu hijo o hija haga los deberes en inglés. En The Afternoon Academy, docentes cualificados ayudan a niños de 4 a 12 años con los deberes, la lectura, la escritura y las matemáticas en grupos reducidos.",
    details: "Después del colegio, de lunes a viernes. Calle Asura 40, Arturo Soria, 28043 Madrid.",
    heading: "¿Cómo es la primera sesión?",
    explanation: "Podéis traer los deberes del colegio o contarnos qué le cuesta más. Le ayudaremos a elegir una tarea, avanzar con el apoyo de un docente y decidir qué hacer después.",
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
