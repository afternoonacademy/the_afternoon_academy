import { LeadForm } from "@/components/forms/lead-form"
import { PublicFooter, PublicHeader } from "@/components/shared/public-shell"
import { Card, CardContent } from "@/components/ui/card"

const supportAreas = [
  "Homework support",
  "English and literacy",
  "Maths confidence",
  "Study skills",
]

const parentBenefits = [
  "Small-group academic sessions",
  "British and international curriculum support",
  "A calm, structured after-school routine",
  "Homework, English, maths and study skills",
  "Simple parent communication",
  "Located around Arturo Soria / Calle Asura",
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <PublicHeader locale="en" />

      <section className="brand-shell flex flex-col gap-16 py-10 md:py-16">
        <div className="brand-hero grid gap-10 p-6 md:p-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="space-y-8">
            <div className="brand-pill">Launching soon in Arturo Soria</div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                A calmer after-school routine for international families in
                Madrid.
              </h1>

              <p className="max-w-2xl text-lg brand-muted md:text-xl">
                Small-group British and international curriculum support for
                children aged approximately 4-12, focused on homework, English,
                maths, study skills and academic confidence.
              </p>

              <p className="max-w-2xl text-base brand-muted md:text-lg">
                We are currently shaping our first timetable and inviting local
                parents to tell us which days, times and types of support would
                work best.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#timetable-form" className="brand-button">
                Help shape the timetable
              </a>

              <a href="#services" className="brand-button-secondary">
                See what we offer
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
                  Designed for busy families
                </h2>

                <p className="brand-muted">
                  The Afternoon Academy helps families turn after-school
                  academic time into something calmer, clearer and more
                  structured.
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
              <p className="brand-kicker">Why we exist</p>

              <h2 className="text-2xl font-semibold">
                Less homework stress. More structure.
              </h2>

              <p className="brand-muted">
                After a long school day, homework can easily become rushed,
                stressful or inconsistent.
              </p>
            </CardContent>
          </Card>

          <Card className="brand-card md:col-span-2">
            <CardContent className="space-y-4 p-6">
              <p className="brand-muted">
                The Afternoon Academy is being created to give children a
                focused place to complete homework, ask questions, practise core
                skills and build better learning habits before they get home.
              </p>

              <p className="brand-muted">
                The aim is not just childcare, and not just private tutoring. It
                is structured academic support for families who want a more
                reliable after-school learning routine.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="services" className="scroll-mt-10 space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="brand-kicker">What we offer</p>

            <h2 className="text-3xl font-bold tracking-tight">
              Academic support after school
            </h2>

            <p className="brand-muted">
              Our first timetable will be shaped by parent demand, but the core
              support areas are expected to include:
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Homework support",
                description:
                  "A structured setting where children can complete school homework with guidance when needed.",
              },
              {
                title: "English and literacy",
                description:
                  "Reading, writing, comprehension, vocabulary, spelling and confidence with written English.",
              },
              {
                title: "Maths support",
                description:
                  "Help with key concepts, practice, problem-solving and building confidence.",
              },
              {
                title: "Study skills",
                description:
                  "Organisation, focus, planning, revision habits and independent learning routines.",
              },
              {
                title: "Small-group sessions",
                description:
                  "Supportive academic groups designed to offer attention and structure without the cost of constant one-to-one tutoring.",
              },
              {
                title: "Optional focused support",
                description:
                  "Private or more targeted sessions may be added later depending on parent demand.",
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
                <p className="brand-kicker">Proposed timetable</p>

                <h2 className="text-3xl font-bold tracking-tight">
                  Session times
                </h2>

                <p className="brand-muted">
                  We are currently planning two after-school session times:
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Early session", time: "17:00 - 17:50" },
                  { label: "Later session", time: "18:00 - 18:50" },
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
                <p className="brand-kicker">Launch days</p>

                <h3 className="text-2xl font-semibold">
                  Initial days under consideration
                </h3>

                <p className="brand-muted">
                  We are currently considering sessions on:
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {["Monday", "Tuesday", "Thursday", "Friday"].map((day) => (
                  <div
                    key={day}
                    className="rounded-2xl border bg-white/60 px-4 py-3 text-sm font-medium"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <p className="text-sm brand-muted">
                Parent responses will help us understand which days are most in
                demand before launch.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="timetable-form" className="scroll-mt-10">
          <Card className="brand-form-panel">
            <CardContent className="grid gap-8 p-6 md:p-8 lg:grid-cols-[360px_1fr]">
              <div className="space-y-4">
                <div className="brand-pill-warm">No obligation</div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-bold tracking-tight">
                    Help us shape the first timetable
                  </h2>

                  <p className="brand-muted">
                    Tell us your child&apos;s age, the type of support you may
                    need, and which days and times would work best.
                  </p>

                  <p className="text-sm brand-muted">
                    Your answers will help us build a timetable around real
                    parent demand before launch.
                  </p>
                </div>
              </div>

              <LeadForm language="en" />
            </CardContent>
          </Card>
        </section>
      </section>

      <PublicFooter locale="en" />
    </main>
  )
}