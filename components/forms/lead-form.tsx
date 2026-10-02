"use client"

import { useActionState, useState } from "react"

import { submitLead, type SubmitLeadState } from "@/actions/submit-lead"
import {
  LeadChildFields,
  type LeadChildDraft,
} from "@/components/forms/lead-child-fields"
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

type LeadFormLanguage = "en" | "es"

const initialState: SubmitLeadState = {
  success: false,
  message: "",
}

function emptyChild(key: number): LeadChildDraft {
  return {
    key,
    firstName: "",
    age: "",
    schoolName: "",
    schoolYear: "",
    curriculum: "",
    supportNeeds: [],
    courseOrExamBoard: "",
    preferredDays: [],
    preferredTimes: [],
    preferredFrequency: "",
    notes: "",
  }
}

const copy = {
  en: {
    cardTitle: "Apply for a place",
    cardDescription:
      "Add each child separately so you can tell us exactly what support and timetable would suit them.",
    parentDetails: "Parent / family details",
    parentDescription:
      "We will only use these details to contact you about your enquiry and availability.",
    parentName: "Parent name",
    email: "Email address",
    phone: "WhatsApp / phone",
    area: "Area",
    areaPlaceholder: "e.g. Conde Orgaz, Arturo Soria",
    childrenHeading: "Children",
    childrenDescription:
      "Each child can have different support needs, days, times and frequency.",
    addChild: "Add another child",
    consent:
      "I agree to be contacted about The Afternoon Academy and this place enquiry.",
    privacy:
      "We will only use your details to contact you about The Afternoon Academy. We will not share your information with third parties.",
    submitting: "Submitting...",
    submit: "Submit place enquiry",
  },
  es: {
    cardTitle: "Solicita una plaza",
    cardDescription:
      "Añade cada niño/a por separado para indicarnos exactamente qué apoyo y horario necesita.",
    parentDetails: "Datos del padre, madre o tutor/a",
    parentDescription:
      "Solo usaremos estos datos para contactarte sobre tu solicitud y disponibilidad.",
    parentName: "Nombre del padre, madre o tutor/a",
    email: "Correo electrónico",
    phone: "WhatsApp / teléfono",
    area: "Zona",
    areaPlaceholder: "p. ej. Conde Orgaz, Arturo Soria",
    childrenHeading: "Niños/as",
    childrenDescription:
      "Cada niño/a puede tener necesidades, días, horarios y frecuencia diferentes.",
    addChild: "Añadir otro niño/a",
    consent:
      "Acepto que me contacten sobre The Afternoon Academy y esta solicitud de plaza.",
    privacy:
      "Solo usaremos tus datos para contactarte sobre The Afternoon Academy. No compartiremos tu información con terceros.",
    submitting: "Enviando...",
    submit: "Enviar solicitud de plaza",
  },
}

export function LeadForm({
  language = "en",
}: {
  language?: LeadFormLanguage
}) {
  const [state, formAction, isPending] = useActionState(submitLead, initialState)
  const [children, setChildren] = useState<LeadChildDraft[]>([emptyChild(1)])
  const [nextKey, setNextKey] = useState(2)
  const t = copy[language]

  const serialisedChildren = children.map(({ key: _key, ...child }) => child)

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{t.cardTitle}</CardTitle>
        <CardDescription>{t.cardDescription}</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-8">
          <input type="hidden" name="language" value={language} />
          <input
            type="hidden"
            name="children"
            value={JSON.stringify(serialisedChildren)}
          />
          <input type="hidden" name="interestLevel" value="priority_launch" />

          {state.message ? (
            <div
              className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
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
                <Input id="area" name="area" placeholder={t.areaPlaceholder} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">{t.childrenHeading}</h3>
              <p className="text-sm text-muted-foreground">
                {t.childrenDescription}
              </p>
            </div>

            <div className="space-y-5">
              {children.map((child, index) => (
                <LeadChildFields
                  key={child.key}
                  child={child}
                  index={index}
                  language={language}
                  canRemove={children.length > 1}
                  onChange={(next) =>
                    setChildren((current) =>
                      current.map((item) =>
                        item.key === child.key ? next : item,
                      ),
                    )
                  }
                  onRemove={() =>
                    setChildren((current) =>
                      current.filter((item) => item.key !== child.key),
                    )
                  }
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setChildren((current) => [...current, emptyChild(nextKey)])
                setNextKey((value) => value + 1)
              }}
            >
              + {t.addChild}
            </Button>
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
