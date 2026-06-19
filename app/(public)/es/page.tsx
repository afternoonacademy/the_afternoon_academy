import { LeadForm } from "@/components/forms/lead-form"
import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Apoyo académico en inglés en Madrid",
  description:
    "The Afternoon Academy ofrece apoyo académico en grupos reducidos para familias en Madrid.",
}

const supportAreas = [
  "Apoyo con deberes",
  "Inglés y lectoescritura",
  "Confianza en matemáticas",
  "Hábitos de estudio",
]

const parentBenefits = [
  "Sesiones académicas en grupos reducidos",
  "Apoyo para currículo británico e internacional",
  "Una rutina extraescolar tranquila y estructurada",
  "Deberes, inglés, matemáticas y técnicas de estudio",
  "Comunicación sencilla con las familias",
  "Zona Arturo Soria / Calle Asura",
]

export default function SpanishHomePage() {
  return (
    <main className="min-h-screen">
      <PublicHeader locale="es" />

      <section className="brand-shell flex flex-col gap-16 py-10 md:py-16">
        <div className="brand-hero grid gap-10 p-6 md:p-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="space-y-8">
            <div className="brand-pill">Próxima apertura en Arturo Soria</div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                Una rutina extraescolar más tranquila para familias
                internacionales en Madrid.
              </h1>

              <p className="max-w-2xl text-lg brand-muted md:text-xl">
                Apoyo académico en grupos reducidos para niños de
                aproximadamente 4 a 12 años, con foco en deberes, inglés,
                matemáticas, hábitos de estudio y confianza académica.
              </p>

              <p className="max-w-2xl text-base brand-muted md:text-lg">
                Estamos preparando nuestro primer horario e invitamos a familias
                locales a decirnos qué días, horas y tipos de apoyo les
                resultarían más útiles.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#timetable-form" className="brand-button">
                Ayúdanos a organizar los horarios
              </a>

              <a href="#services" className="brand-button-secondary">
                Ver qué ofrecemos
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {supportAreas.map((item) => (
                <Card key={item} className="brand-card">
                  <CardContent className="p-4 text-sm font-medium">
                    {item}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="brand-card">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">
                  Diseñado para familias ocupadas
                </h2>

                <p className="brand-muted">
                  The Afternoon Academy ayuda a convertir el tiempo académico
                  después del colegio en una rutina más tranquila, clara y
                  estructurada.
                </p>
              </div>

              <ul className="space-y-3 text-sm brand-muted">
                {parentBenefits.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="brand-check" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="brand-card md:col-span-1">
            <CardContent className="space-y-3 p-6">
              <p className="brand-kicker">Por qué existimos</p>

              <h2 className="text-2xl font-semibold">
                Menos estrés con los deberes. Más estructura.
              </h2>

              <p className="brand-muted">
                Después de un largo día escolar, los deberes pueden acabar
                siendo apresurados, estresantes o poco constantes.
              </p>
            </CardContent>
          </Card>

          <Card className="brand-card md:col-span-2">
            <CardContent className="space-y-4 p-6">
              <p className="brand-muted">
                The Afternoon Academy nace para ofrecer a los niños un espacio
                centrado donde completar deberes, hacer preguntas, practicar
                habilidades clave y desarrollar mejores hábitos de aprendizaje
                antes de llegar a casa.
              </p>

              <p className="brand-muted">
                No es solo cuidado infantil ni solo clases particulares. Es
                apoyo académico estructurado para familias que quieren una
                rutina extraescolar más fiable.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="services" className="scroll-mt-10 space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="brand-kicker">Qué ofrecemos</p>

            <h2 className="text-3xl font-bold tracking-tight">
              Apoyo académico después del colegio
            </h2>

            <p className="brand-muted">
              El primer horario se organizará según la demanda de las familias,
              pero las áreas principales serán:
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Apoyo con deberes",
                description:
                  "Un entorno estructurado donde los niños pueden completar sus deberes con orientación cuando la necesiten.",
              },
              {
                title: "Inglés y lectoescritura",
                description:
                  "Lectura, escritura, comprensión, vocabulario, ortografía y confianza con el inglés escrito.",
              },
              {
                title: "Matemáticas",
                description:
                  "Ayuda con conceptos clave, práctica, resolución de problemas y confianza.",
              },
              {
                title: "Técnicas de estudio",
                description:
                  "Organización, concentración, planificación, hábitos de repaso y autonomía.",
              },
              {
                title: "Grupos reducidos",
                description:
                  "Sesiones de apoyo con estructura y atención, sin el coste continuo de clases individuales.",
              },
              {
                title: "Apoyo específico opcional",
                description:
                  "Más adelante podremos añadir clases privadas o sesiones más enfocadas según la demanda.",
              },
            ].map((service) => (
              <Card key={service.title} className="brand-card">
                <CardContent className="space-y-2 p-6">
                  <h3 className="font-semibold">{service.title}</h3>

                  <p className="text-sm brand-muted">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Card className="brand-card">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="brand-kicker">Horario propuesto</p>

                <h2 className="text-3xl font-bold tracking-tight">
                  Horarios de sesión
                </h2>

                <p className="brand-muted">
                  Actualmente estamos considerando dos horarios después del
                  colegio:
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Primera sesión", time: "17:00 - 17:50" },
                  { label: "Segunda sesión", time: "18:00 - 18:50" },
                ].map((session) => (
                  <div
                    key={session.label}
                    className="rounded-2xl border bg-white/60 p-4"
                  >
                    <p className="text-sm brand-muted">{session.label}</p>
                    <p className="text-xl font-semibold">{session.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="brand-card">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="brand-kicker">Días de apertura</p>

                <h3 className="text-2xl font-semibold">
                  Días iniciales en estudio
                </h3>

                <p className="brand-muted">
                  Actualmente estamos valorando sesiones los siguientes días:
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {["Lunes", "Martes", "Jueves", "Viernes"].map((day) => (
                  <div
                    key={day}
                    className="rounded-2xl border bg-white/60 px-4 py-3 text-sm font-medium"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <p className="text-sm brand-muted">
                Las respuestas de las familias nos ayudarán a entender qué días
                tienen más demanda antes de abrir.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="timetable-form" className="scroll-mt-10">
          <Card className="brand-form-panel">
            <CardContent className="grid gap-8 p-6 md:p-8 lg:grid-cols-[360px_1fr]">
              <div className="space-y-4">
                <div className="brand-pill-warm">Sin compromiso</div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-bold tracking-tight">
                    Ayúdanos a organizar el primer horario
                  </h2>

                  <p className="brand-muted">
                    Indícanos la edad de tu hijo/a, el tipo de apoyo que podría
                    necesitar y qué días y horarios os vendrían mejor.
                  </p>

                  <p className="text-sm brand-muted">
                    Tus respuestas nos ayudarán a crear un horario basado en la
                    demanda real de las familias antes de abrir.
                  </p>
                </div>
              </div>

              <LeadForm language="es" />
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border bg-white/60 p-6 text-center">
          <h2 className="text-2xl font-semibold">
            ¿Tienes alguna pregunta antes?
          </h2>

          <p className="mx-auto mt-2 max-w-2xl brand-muted">
            Si quieres preguntar por edades, ubicación, currículo, hermanos,
            clases privadas o cualquier otra cuestión, puedes escribirnos antes
            de completar el formulario de horarios.
          </p>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/es/contact" className="brand-button-secondary">
              Contactar
            </a>

            <a href="#timetable-form" className="brand-button">
              Compartir preferencias de horario
            </a>
          </div>
        </section>
      </section>

      <PublicFooter locale="es" />
    </main>
  )
}