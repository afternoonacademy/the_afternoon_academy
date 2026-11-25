import Image from "next/image"
import Link from "next/link"
import { AcademyCTA, DiscoveryLayout } from "@/components/discovery/discovery-layout"
import { root, resources, supports, neighbourhoods, schools, translated, type Language } from "@/lib/discovery/content"

const words = {
  en: {
    kicker: "The Afternoon Academy · Family guides",
    heading: "Helpful guidance for learning, school and family life.",
    introduction: "Clear, practical resources for parents, academic support at every stage, and independent information about schools and neighbourhoods around Madrid.",
    parent: "Parent resources",
    parentLead: "Start with the questions that matter at home. Explore homework, routines and how to choose the right support.",
    academic: "Academic support",
    academicLead: "Explore ways to build confidence, subject understanding and independent study habits.",
    local: "Schools & neighbourhoods",
    localLead: "Independent local information to help families get oriented. TAA is not affiliated with the schools listed here.",
    neighbourhood: "Neighbourhood guides",
    schools: "School directory",
    featured: "Featured parent guide",
    browse: "Read the guide",
  },
  es: {
    kicker: "The Afternoon Academy · Guías para familias",
    heading: "Consejos útiles para el aprendizaje, el colegio y la vida familiar.",
    introduction: "Recursos prácticos para familias, apoyo académico e información independiente sobre colegios y barrios de Madrid.",
    parent: "Recursos para familias",
    parentLead: "Empieza por las preguntas del día a día: deberes, rutinas y cómo elegir el apoyo adecuado.",
    academic: "Apoyo académico",
    academicLead: "Ideas para fortalecer la confianza, la comprensión de las asignaturas y la autonomía.",
    local: "Colegios y barrios",
    localLead: "Información local independiente. TAA no está afiliada a los colegios que aparecen aquí.",
    neighbourhood: "Guías de barrios",
    schools: "Directorio de colegios",
    featured: "Guía destacada para familias",
    browse: "Leer la guía",
  },
}

function GuideCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="brand-card group block h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      <h3 className="text-lg font-semibold group-hover:underline">{title}</h3>
      <p className="brand-muted mt-2 text-sm leading-relaxed">{description}</p>
    </Link>
  )
}

export function GuideHome({ lang }: { lang: Language }) {
  const t = words[lang]
  const prefix = root(lang)
  const featured = resources.find(item => item.slug === "homework-without-conflict")
  const otherResources = resources.filter(item => item.slug !== "homework-without-conflict")
  return (
    <DiscoveryLayout lang={lang} switchHref={root(lang === "en" ? "es" : "en")}>
      <header className="mb-12 max-w-4xl">
        <p className="brand-kicker">{t.kicker}</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">{t.heading}</h1>
        <p className="brand-muted mt-5 max-w-3xl text-lg leading-relaxed">{t.introduction}</p>
        <nav aria-label={lang === "en" ? "Guide categories" : "Categorías de guías"} className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
          <a className="rounded-full border px-4 py-2 hover:bg-white" href="#parent-resources">{t.parent}</a>
          <a className="rounded-full border px-4 py-2 hover:bg-white" href="#academic-support">{t.academic}</a>
          <a className="rounded-full border px-4 py-2 hover:bg-white" href="#local-guides">{t.local}</a>
        </nav>
      </header>

      <section id="parent-resources" aria-labelledby="parent-resources-heading" className="mb-16 scroll-mt-8">
        <h2 id="parent-resources-heading" className="text-3xl font-bold">{t.parent}</h2>
        <p className="brand-muted mt-2 mb-6 max-w-3xl">{t.parentLead}</p>
        {featured && (
          <Link href={prefix + "/resources/" + featured.slug} className="brand-card group mb-5 grid overflow-hidden md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <Image src="/images/homework-guide/taa-drawing-activity-enhanced.jpg" width={1448} height={1086} sizes="(min-width: 768px) 40vw, 100vw" alt={lang === "en" ? "Children drawing at an Academy table, viewed from behind" : "Niños dibujando en una mesa de la academia, vistos desde atrás"} className="h-full w-full object-cover" priority />
            <div className="flex flex-col justify-center p-6 md:p-8">
              <p className="brand-kicker">{t.featured}</p>
              <h3 className="mt-3 text-2xl font-bold group-hover:underline">{translated(featured, lang).title}</h3>
              <p className="brand-muted mt-3 text-sm leading-relaxed">{translated(featured, lang).description}</p>
              <span className="mt-5 text-sm font-semibold text-blue-700">{t.browse} →</span>
            </div>
          </Link>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherResources.map(item => <GuideCard key={item.slug} href={prefix + "/resources/" + item.slug} title={translated(item, lang).title} description={translated(item, lang).description} />)}
        </div>
      </section>

      <section id="academic-support" aria-labelledby="academic-support-heading" className="mb-16 scroll-mt-8">
        <h2 id="academic-support-heading" className="text-3xl font-bold">{t.academic}</h2>
        <p className="brand-muted mt-2 mb-6 max-w-3xl">{t.academicLead}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supports.map(item => <GuideCard key={item.slug} href={prefix + "/supports/" + item.slug} title={translated(item, lang).title} description={translated(item, lang).description} />)}
        </div>
      </section>

      <section id="local-guides" aria-labelledby="local-guides-heading" className="mb-14 scroll-mt-8">
        <h2 id="local-guides-heading" className="text-3xl font-bold">{t.local}</h2>
        <p className="brand-muted mt-2 mb-7 max-w-3xl">{t.localLead}</p>
        <h3 className="mb-4 text-xl font-bold">{t.neighbourhood}</h3>
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {neighbourhoods.map(item => <GuideCard key={item.slug} href={prefix + "/neighbourhoods/" + item.slug} title={translated(item, lang).title} description={translated(item, lang).description} />)}
        </div>
        <h3 className="mb-4 text-xl font-bold">{t.schools}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schools.filter(item => item.verified).map(item =>
            <Link key={item.slug} href={prefix + "/schools/" + item.slug} className="brand-card block p-4 transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              <h4 className="font-semibold">{item.name}</h4>
              <p className="brand-muted mt-1 text-sm">{item.area}</p>
            </Link>
          )}
        </div>
      </section>
      <AcademyCTA lang={lang} />
    </DiscoveryLayout>
  )
}
