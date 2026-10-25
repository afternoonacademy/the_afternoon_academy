import type { Metadata } from "next"
import Link from "next/link"
import {
  Atom,
  BookOpenCheck,
  Calculator,
  MapPin,
  Users,
} from "lucide-react"

import { FocusGroupInterestForm } from "@/components/forms/focus-group-interest-form"
import {
  PublicFooter,
  PublicHeader,
} from "@/components/shared/public-shell"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Focus Group de Química IGCSE en Madrid",
  description:
    "Apoyo de Química IGCSE en grupos reducidos para alumnos de Years 10–11 en Arturo Soria, Madrid. Enseñanza enfocada, máximo seis alumnos y 40 € por sesión de 50 minutos.",
  alternates: {
    canonical: "/es/focus-groups/igcse-chemistry",
    languages: {
      en: "/focus-groups/igcse-chemistry",
      es: "/es/focus-groups/igcse-chemistry",
    },
  },
}

export const dynamic = "force-dynamic"

const benefits = [
  [
    BookOpenCheck,
    "Química del colegio",
    "Trae el tema actual, los deberes y tus preguntas. Las sesiones refuerzan la comprensión junto al aprendizaje del colegio.",
  ],
  [
    Atom,
    "Conceptos explicados con claridad",
    "Enseñanza enfocada para ideas difíciles, vocabulario específico y conexiones entre temas.",
  ],
  [
    Calculator,
    "Cálculos y resolución de problemas",
    "Práctica para aplicar conceptos, explicar métodos y resolver problemas de Química con precisión.",
  ],
  [
    Users,
    "Un grupo formado de manera deliberada",
    "Hasta seis alumnos de Years 10–11 que estudian la misma asignatura y un nivel de cualificación similar.",
  ],
]

export default function SpanishIgcseChemistryFocusGroupPage() {
  return (
    <main className="min-h-screen">
      <PublicHeader
        locale="es"
        switchHref="/focus-groups/igcse-chemistry"
      />

      <div className="brand-shell space-y-14 py-10 md:py-16">
        <section className="brand-hero grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_340px] lg:items-center">
          <div className="space-y-6">
            <p className="brand-pill">Nuevo Focus Group · Years 10–11</p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                Apoyo de Química IGCSE en Madrid.
              </h1>
              <p className="max-w-2xl text-lg brand-muted md:text-xl">
                Una sesión especializada de Química en grupo reducido para
                alumnos que se benefician de una enseñanza enfocada junto a
                sus estudios del currículo británico.
              </p>
              <p className="max-w-2xl brand-muted">
                Es un tipo de grupo adicional de The Afternoon Academy,
                distinto de nuestro Homework Club. Formamos cada grupo con
                cuidado según la edad, la etapa y las necesidades de
                aprendizaje.
              </p>
            </div>
            <a className="brand-button" href="#register">
              Registrar interés en Química IGCSE
            </a>
          </div>

          <Card className="brand-card border-[color:var(--brand-gold)] bg-[rgba(255,250,240,0.92)]">
            <CardContent className="space-y-4 p-7">
              <p className="brand-kicker">En resumen</p>
              <p className="text-4xl font-bold">40 €</p>
              <p className="font-semibold">por sesión de 50 minutos</p>
              <div className="space-y-2 border-y py-4 text-sm brand-muted">
                <p>
                  <strong className="text-foreground">
                    Máximo 6 alumnos
                  </strong>
                </p>
                <p>17:00–17:50 o 18:00–18:50</p>
                <p>Arturo Soria · Calle Asura</p>
              </div>
              <p className="text-sm brand-muted">
                Registrar interés no reserva ni confirma una plaza.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <Card className="brand-card">
            <CardContent className="space-y-3 p-6">
              <p className="brand-kicker">¿Qué es un Focus Group?</p>
              <h2 className="text-3xl font-bold tracking-tight">
                Enseñanza específica de una asignatura en un grupo reducido.
              </h2>
            </CardContent>
          </Card>

          <Card className="brand-card">
            <CardContent className="space-y-4 p-6 brand-muted">
              <p>
                A diferencia del Homework Club general, un Focus Group reúne a
                alumnos de edad y etapa similares que estudian la misma
                asignatura especializada. Permite que un profesor cualificado
                enseñe directamente, detecte malentendidos y desarrolle
                confianza mediante práctica cuidadosamente elegida.
              </p>
              <p>
                Está pensado para alumnos que siguen IGCSE o un curso de
                Química comparable del currículo británico. Antes de confirmar
                una plaza hablaremos sobre el curso actual y las necesidades
                del alumno/a para comprobar que el grupo encaja bien.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="brand-kicker">Cómo ayudamos</p>
            <h2 className="text-3xl font-bold tracking-tight">
              Apoyo enfocado para que el siguiente paso quede claro.
            </h2>
            <p className="brand-muted">
              Las sesiones pueden apoyar consolidación, repaso y preparación
              adecuada de exámenes sin prometer notas concretas ni centrarse en
              una única entidad examinadora.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map(([Icon, title, copy]) => (
              <Card className="brand-card" key={title as string}>
                <CardContent className="space-y-4 p-6">
                  <Icon className="h-6 w-6" />
                  <h3 className="text-xl font-semibold">{title as string}</h3>
                  <p className="text-sm brand-muted">{copy as string}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="brand-card">
            <CardContent className="space-y-3 p-6">
              <MapPin className="h-6 w-6" />
              <h2 className="text-2xl font-bold">
                Arturo Soria / Calle Asura
              </h2>
              <p className="brand-muted">
                Un entorno de aprendizaje tranquilo y en inglés para familias
                de colegios británicos e internacionales de Madrid.
              </p>
              <Link
                className="text-sm font-semibold underline"
                href="/es/ubicacion"
              >
                Ver la ubicación
              </Link>
            </CardContent>
          </Card>

          <Card className="brand-card">
            <CardContent className="space-y-3 p-6">
              <Users className="h-6 w-6" />
              <h2 className="text-2xl font-bold">Para quién es</h2>
              <p className="brand-muted">
                Alumnos de Years 10–11 que estudian Química IGCSE o del
                currículo británico y se beneficiarían de un grupo pequeño y
                especializado.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="register" className="scroll-mt-10">
          <div className="mb-6 max-w-3xl">
            <p className="brand-kicker">Registro de interés</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Cuéntanos sobre el alumno/a y el mejor horario.
            </h2>
            <p className="mt-3 brand-muted">
              Revisaremos la demanda, el curso actual y la preferencia de
              horario antes de invitar a la familia a hablar sobre un grupo
              adecuado.
            </p>
          </div>

          <FocusGroupInterestForm language="es" />
        </section>
      </div>

      <PublicFooter
        locale="es"
        switchHref="/focus-groups/igcse-chemistry"
      />
    </main>
  )
}
