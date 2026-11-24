import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { DiscoveryLayout } from "@/components/discovery/discovery-layout"
import { root, type Language } from "@/lib/discovery/content"
import {
  homeworkParentGuide,
  homeworkParentGuideSources,
} from "@/lib/discovery/homework-parent-guide"

const articlePath = "/resources/homework-without-conflict"
const heroImage = "/images/homework-guide/taa-drawing-activity-enhanced.jpg"
const heroAlt = {
  en: "Children drawing with coloured pencils at a table at The Afternoon Academy, photographed from behind.",
  es: "Niños dibujando con lápices de colores en una mesa de The Afternoon Academy, fotografiados desde atrás.",
}

export function homeworkSupportMetadata(lang: Language): Metadata {
  const content = homeworkParentGuide[lang]
  const canonical = root(lang) + articlePath
  const title = content.title + " | The Afternoon Academy"
  return {
    title: content.title,
    description: content.intro,
    alternates: {
      canonical,
      languages: { en: root("en") + articlePath, es: root("es") + articlePath },
    },
    openGraph: {
      title,
      description: content.intro,
      url: canonical,
      type: "article",
      locale: lang === "en" ? "en_GB" : "es_ES",
      alternateLocale: lang === "en" ? "es_ES" : "en_GB",
      siteName: "The Afternoon Academy",
      modifiedTime: "2026-11-24",
      images: [{ url: heroImage, width: 1448, height: 1086, alt: heroAlt[lang] }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: content.intro,
      images: [heroImage],
    },
  }
}

function ReferencedParagraph({ text, lang }: { text: string; lang: Language }) {
  return (
    <p className="text-base leading-8 text-slate-700 sm:text-lg">
      {text.split(/(\[\d+\])/).map((part, index) => {
        const match = part.match(/^\[(\d+)\]$/)
        const source = match && homeworkParentGuideSources[Number(match[1]) - 1]
        if (!match || !source) return part
        return (
          <sup key={index} className="ml-0.5">
            <a
              href={`#source-${match[1]}`}
              aria-label={`${lang === "en" ? "Source" : "Fuente"} ${match[1]}: ${source.title}`}
              className="rounded px-0.5 font-semibold text-slate-700 underline underline-offset-2 focus-visible:outline-2"
            >
              {part}
            </a>
          </sup>
        )
      })}
    </p>
  )
}

export function HomeworkSupportArticle({ lang }: { lang: Language }) {
  const content = homeworkParentGuide[lang]
  const switchLanguage = lang === "en" ? "es" : "en"
  const sections = content.sections.slice(0, -1)
  const academySection = content.sections[content.sections.length - 1]

  return (
    <DiscoveryLayout lang={lang} switchHref={root(switchLanguage) + articlePath}>
      <article lang={lang} className="mx-auto max-w-6xl">
        <nav aria-label={lang === "en" ? "Family guide" : "Guía para familias"}>
          <Link className="text-sm underline underline-offset-4" href={root(lang)}>
            {lang === "en" ? "Back to the family guide" : "Volver a la guía para familias"}
          </Link>
        </nav>

        <header className="mt-8 grid items-center gap-8 md:grid-cols-[1.1fr_1fr] md:gap-12">
          <div>
            <p className="brand-kicker">{lang === "en" ? "A guide for parents" : "Una guía para familias"}</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{content.title}</h1>
            <p className="mt-5 text-lg leading-8 brand-muted">{content.intro}</p>
            <p className="mt-6 text-sm leading-6 brand-muted">
              The Afternoon Academy · {lang === "en" ? "Updated " : "Actualizado el "}
              <time dateTime="2026-11-24">{lang === "en" ? "24 November 2026" : "24 de noviembre de 2026"}</time>
            </p>
          </div>
          <figure>
            <Image
              src={heroImage}
              alt={heroAlt[lang]}
              width={1448}
              height={1086}
              sizes="(min-width: 1280px) 520px, (min-width: 768px) 45vw, 100vw"
              loading="eager"
              className="aspect-[4/3] w-full rounded-3xl object-cover"
            />
            <figcaption className="mt-3 text-sm brand-muted">
              {lang === "en" ? "Learning together at The Afternoon Academy, Arturo Soria." : "Aprendiendo juntos en The Afternoon Academy, Arturo Soria."}
            </figcaption>
          </figure>
        </header>

        <div className="mx-auto mt-12 max-w-3xl space-y-9">
          {sections.map((section, index) => {
            const numbered = /^[1-5] /.test(section.title)
            const Heading = numbered ? "h3" : "h2"
            return (
              <section key={index} className="space-y-4">
                {section.title && (
                  <Heading className={numbered ? "text-xl font-semibold leading-8 sm:text-2xl" : "text-2xl font-bold leading-9 sm:text-3xl"}>
                    {section.title}
                  </Heading>
                )}
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <ReferencedParagraph key={paragraphIndex} text={paragraph} lang={lang} />
                ))}
              </section>
            )
          })}
        </div>

        <section className="mt-14 grid gap-8 rounded-3xl border bg-white/80 p-6 md:grid-cols-[1fr_1.4fr] md:p-9">
          <Image
            src="/images/homework-guide/taa-teacher-support-enhanced.jpg"
            alt={lang === "en" ? "An adult and a child looking at worksheets together at a desk at The Afternoon Academy." : "Una persona adulta y un niño revisan juntos unas fichas en un escritorio de The Afternoon Academy."}
            width={1448}
            height={1086}
            sizes="(min-width: 1280px) 430px, (min-width: 768px) 40vw, 100vw"
            className="h-auto w-full self-start rounded-2xl"
          />
          <div className="space-y-4">
            <h2 className="text-2xl font-bold leading-9 sm:text-3xl">{academySection.title}</h2>
            {academySection.paragraphs.map((paragraph, index) => (
              <ReferencedParagraph key={index} text={paragraph} lang={lang} />
            ))}
            <Link className="brand-button mt-3 h-auto min-h-11 max-w-full py-3 text-center" href={lang === "en" ? "/free-first-session" : "/es/primera-sesion-gratis"}>
              {content.ctaLabel}
            </Link>
          </div>
        </section>

        <footer className="mx-auto mt-12 max-w-3xl space-y-6 border-t pt-8">
          <p className="text-sm leading-7 brand-muted">{content.note}</p>
          <section aria-labelledby="article-sources">
            <h2 id="article-sources" className="text-xl font-bold">{lang === "en" ? "Sources and further reading" : "Fuentes y lecturas recomendadas"}</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6">
              {homeworkParentGuideSources.map((source, index) => (
                <li id={`source-${index + 1}`} key={source.url} className="scroll-mt-24 pl-1">
                  <a href={source.url} className="underline underline-offset-4">{source.title}</a>
                </li>
              ))}
            </ol>
          </section>
          <Link className="inline-block underline underline-offset-4" href={root(lang) + "/supports/homework"}>
            {lang === "en" ? "Explore homework support at TAA" : "Conoce el apoyo con los deberes en TAA"}
          </Link>
        </footer>
      </article>
    </DiscoveryLayout>
  )
}
