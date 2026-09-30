"use client"

import { useActionState } from "react"

import { submitLead, type SubmitLeadState } from "@/actions/submit-lead"
import { LeadAdditionalChildren } from "@/components/forms/lead-additional-children"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type LeadFormLanguage = "en" | "es"

const initialState: SubmitLeadState = {
  success: false,
  message: "",
}

const copy = {
  en: {
    cardTitle: "Apply for a launch place",
    cardDescription:
      "Tell us about your child, the support you are looking for and the sessions that would suit your family. We will contact you to confirm availability and next steps.",

    parentDetails: "Parent details",
    parentDescription:
      "We will only use this to contact you about your place enquiry and availability.",
    parentName: "Parent name",
    email: "Email address",
    phone: "WhatsApp / phone",
    area: "Area",
    areaPlaceholder: "e.g. Conde Orgaz, Arturo Soria",
    schoolName: "Child&apos;s current school name",
    optional: "Optional",

    childDetails: "Child details",
    childDescription: "The Afternoon Academy currently welcomes children aged 4–12.",
    childAge: "Child age",
    childFirstName: "Child’s first name",
    schoolYear: "School year",
    curriculum: "Curriculum",
    selectOne: "Select one",
    british: "British curriculum",
    ibInternational: "IB / International curriculum",
    spanish: "Spanish curriculum",
    otherNotSure: "Other / not sure",

    supportNeeded: "Support needed",
    supportDescription: "Select everything that would be useful for your child.",

    preferredDays: "Preferred days",
    daysDescription: "Choose the days that could work for your family.",

    preferredTimes: "Preferred times",
    timesDescription: "Choose all session times that may work.",

    frequency: "How many sessions would you like each week?",
    oneDay: "1 session per week",
    twoDays: "2 sessions per week",
    threeDays: "3 sessions per week",
    fourPlusDays: "4+ sessions per week",
    notSure: "Not sure yet",

    notes: "Anything else we should know?",
    notesPlaceholder:
      "Optional - for example, siblings, ideal days, or specific support needed.",

    consent:
      "I agree to be contacted about The Afternoon Academy and this place enquiry.",
    privacy:
      "We will only use your details to contact you about The Afternoon Academy. We will not share your information with third parties.",

    submitting: "Submitting...",
    submit: "Submit place enquiry",
  },

  es: {
    cardTitle: "Solicita una plaza para el lanzamiento",
    cardDescription:
      "Cuéntanos sobre tu hijo/a, el apoyo que buscas y las sesiones que podrían encajar con tu familia. Te contactaremos para confirmar disponibilidad y próximos pasos.",

    parentDetails: "Datos del padre, madre o tutor/a",
    parentDescription:
      "Solo usaremos estos datos para contactarte sobre tu solicitud de plaza y disponibilidad.",
    parentName: "Nombre del padre, madre o tutor/a",
    email: "Correo electrónico",
    phone: "WhatsApp / teléfono",
    area: "Zona",
    areaPlaceholder: "p. ej. Conde Orgaz, Arturo Soria",
    schoolName: "Colegio actual del niño/a",
    optional: "Opcional",

    childDetails: "Datos del niño/a",
    childDescription: "The Afternoon Academy actualmente acoge a niños de 4 a 12 años.",
    childAge: "Edad del niño/a",
    childFirstName: "Nombre del niño/a",
    schoolYear: "Curso escolar",
    curriculum: "Currículo",
    selectOne: "Selecciona una opción",
    british: "Currículo británico",
    ibInternational: "IB / currículo internacional",
    spanish: "Currículo español",
    otherNotSure: "Otro / no estoy seguro/a",

    supportNeeded: "Tipo de apoyo necesario",
    supportDescription: "Selecciona todo lo que sería útil para tu hijo/a.",

    preferredDays: "Días preferidos",
    daysDescription: "Elige los días que podrían funcionar para tu familia.",

    preferredTimes: "Horarios preferidos",
    timesDescription: "Elige todos los horarios de sesión que podrían funcionar.",

    frequency: "¿Cuántas sesiones te gustaría que asistiera cada semana?",
    oneDay: "1 sesión por semana",
    twoDays: "2 sesiones por semana",
    threeDays: "3 sesiones por semana",
    fourPlusDays: "4+ sesiones por semana",
    notSure: "No estoy seguro/a todavía",

    notes: "¿Hay algo más que debamos saber?",
    notesPlaceholder:
      "Opcional - por ejemplo, hermanos, días ideales o apoyo específico necesario.",

    consent:
      "Acepto que me contacten sobre The Afternoon Academy y esta solicitud de plaza.",
    privacy:
      "Solo usaremos tus datos para contactarte sobre The Afternoon Academy. No compartiremos tu información con terceros.",

    submitting: "Enviando...",
    submit: "Enviar solicitud de plaza",
  },
}

const supportNeeds = [
  {
    value: "homework_help",
    en: "Homework help",
    es: "Apoyo con deberes",
  },
  {
    value: "reading",
    en: "Reading",
    es: "Lectura",
  },
  {
    value: "writing",
    en: "Writing",
    es: "Escritura",
  },
  {
    value: "maths",
    en: "Maths confidence",
    es: "Confianza en matemáticas",
  },
  {
    value: "english_confidence",
    en: "English confidence",
    es: "Confianza con el inglés",
  },
  { value: "homework_routine", en: "Homework routine", es: "Rutina de deberes" },
  {
    value: "general_support",
    en: "General academic support",
    es: "Apoyo académico general",
  },
  {
    value: "one_to_one",
    en: "1-to-1 support (subject to availability)",
    es: "Apoyo individual (según disponibilidad)",
  },
]

const days = [
  { value: "monday", en: "Monday", es: "Lunes" },
  { value: "tuesday", en: "Tuesday", es: "Martes" },
  { value: "thursday", en: "Thursday", es: "Jueves" },
  { value: "friday", en: "Friday", es: "Viernes" },
]

const times = [
  { value: "17:00-17:50", label: "17:00–17:50" },
  { value: "18:00-18:50", label: "18:00–18:50" },
]

export function LeadForm({
  language = "en",
}: {
  language?: LeadFormLanguage
}) {
  const [state, formAction, isPending] = useActionState(
    submitLead,
    initialState
  )

  const t = copy[language]

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{t.cardTitle}</CardTitle>
        <CardDescription>{t.cardDescription}</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-8">
          <input type="hidden" name="language" value={language} />

          {state.message ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">{t.parentDetails}</h3>
              <p className="text-sm text-muted-foreground">
                {t.parentDescription}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="childFirstName">{t.childFirstName}</Label>
                <Input id="childFirstName" name="childFirstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentName">{t.parentName}</Label>
                <Input id="parentName" name="parentName" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t.phone}</Label>
                <Input id="phone" name="phone" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">{t.area}</Label>
                <Input
                  id="area"
                  name="area"
                  placeholder={t.areaPlaceholder}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="schoolName">
                  {language === "en" ? (
                    <>Child&apos;s current school name</>
                  ) : (
                    t.schoolName
                  )}
                </Label>
                <Input id="schoolName" name="schoolName" placeholder={t.optional} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">{t.childDetails}</h3>
              <p className="text-sm text-muted-foreground">
                {t.childDescription}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="childAge">{t.childAge}</Label>
                <Input
                  id="childAge"
                  name="childAge"
                  type="number"
                  min="4"
                  max="12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolYear">{t.schoolYear}</Label>
                <Input id="schoolYear" name="schoolYear" placeholder={t.optional} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="curriculum">{t.curriculum}</Label>
                <select
                  id="curriculum"
                  name="curriculum"
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t.selectOne}
                  </option>
                  <option value="british">{t.british}</option>
                  <option value="ib_international">{t.ibInternational}</option>
                  <option value="spanish">{t.spanish}</option>
                  <option value="other_not_sure">{t.otherNotSure}</option>
                </select>
              </div>
            </div>
            <LeadAdditionalChildren language={language} />
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">{t.supportNeeded}</h3>
              <p className="text-sm text-muted-foreground">
                {t.supportDescription}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {supportNeeds.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-3 rounded-md border p-3 text-sm"
                >
                  <Checkbox name="supportNeeds" value={item.value} />
                  <span>{item[language]}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">{t.preferredDays}</h3>
              <p className="text-sm text-muted-foreground">
                {t.daysDescription}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              {days.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-3 rounded-md border p-3 text-sm"
                >
                  <Checkbox name="preferredDays" value={day.value} />
                  <span>{day[language]}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">{t.preferredTimes}</h3>
              <p className="text-sm text-muted-foreground">
                {t.timesDescription}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {times.map((time) => (
                <label
                  key={time.value}
                  className="flex items-center gap-3 rounded-md border p-3 text-sm"
                >
                  <Checkbox name="preferredTimes" value={time.value} />
                  <span>{time.label}</span>
                </label>
              ))}
            </div>
          </section>

          <input type="hidden" name="interestLevel" value="priority_launch" />

          <section>
            <div className="space-y-2">
              <Label htmlFor="preferredFrequency">{t.frequency}</Label>
              <select
                id="preferredFrequency"
                name="preferredFrequency"
                required
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  {t.selectOne}
                </option>
                <option value="one_day">{t.oneDay}</option>
                <option value="two_days">{t.twoDays}</option>
                <option value="three_days">{t.threeDays}</option>
                <option value="four_plus_days">{t.fourPlusDays}</option>
                <option value="not_sure">{t.notSure}</option>
              </select>
            </div>

          </section>

          <section className="space-y-2">
            <Label htmlFor="notes">{t.notes}</Label>
            <Textarea id="notes" name="notes" placeholder={t.notesPlaceholder} />
          </section>

          <section className="space-y-4">
            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Checkbox name="consentContact" required />
              <span>{t.consent}</span>
            </label>

            <p className="text-xs text-muted-foreground">{t.privacy}</p>
          </section>

          <Button type="submit" size="lg" disabled={isPending} className="w-full">
            {isPending ? t.submitting : t.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
