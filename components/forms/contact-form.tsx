"use client"

import { useActionState } from "react"

import {
  submitContact,
  type SubmitContactState,
} from "@/actions/submit-contact"
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

type ContactFormLanguage = "en" | "es"

const initialState: SubmitContactState = {
  success: false,
  message: "",
}

const copy = {
  en: {
    title: "Send us a message",
    description:
      "Use this for general questions about The Afternoon Academy. If you want to help us shape the timetable, please use the timetable form on the homepage.",
    name: "Name",
    email: "Email address",
    phone: "Phone / WhatsApp",
    optional: "Optional",
    message: "Message",
    placeholder: "Tell us what you would like to ask.",
    consent: "I agree to be contacted about my enquiry.",
    privacy:
      "We will only use your details to respond to your enquiry. We will not share your information with third parties.",
    sending: "Sending...",
    button: "Send message",
  },
  es: {
    title: "Envíanos un mensaje",
    description:
      "Utiliza este formulario para preguntas generales sobre The Afternoon Academy. Si quieres ayudarnos a organizar los horarios, utiliza el formulario de horarios en la página principal.",
    name: "Nombre",
    email: "Correo electrónico",
    phone: "Teléfono / WhatsApp",
    optional: "Opcional",
    message: "Mensaje",
    placeholder: "Cuéntanos qué te gustaría preguntar.",
    consent: "Acepto que me contacten sobre mi consulta.",
    privacy:
      "Solo usaremos tus datos para responder a tu consulta. No compartiremos tu información con terceros.",
    sending: "Enviando...",
    button: "Enviar mensaje",
  },
}

export function ContactForm({
  language = "en",
}: {
  language?: ContactFormLanguage
}) {
  const [state, formAction, isPending] = useActionState(
    submitContact,
    initialState
  )

  const t = copy[language]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="language" value={language} />

          {state.message ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input id="phone" name="phone" placeholder={t.optional} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t.message}</Label>
            <Textarea
              id="message"
              name="message"
              required
              rows={7}
              placeholder={t.placeholder}
            />
          </div>

          <section className="space-y-4">
            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Checkbox name="consentContact" required />
              <span>{t.consent}</span>
            </label>

            <p className="text-xs text-muted-foreground">{t.privacy}</p>
          </section>

          <Button type="submit" size="lg" disabled={isPending} className="w-full">
            {isPending ? t.sending : t.button}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}