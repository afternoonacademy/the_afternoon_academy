"use client"

import { useActionState } from "react"
import { LoaderCircle } from "lucide-react"

import {
  submitFocusGroupInterest,
  type FocusGroupInterestState,
} from "@/actions/submit-focus-group-interest"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialState: FocusGroupInterestState = { success: false, message: "" }

export function FocusGroupInterestForm({
  language = "en",
}: {
  language?: "en" | "es"
}) {
  const [state, action, pending] = useActionState(
    submitFocusGroupInterest,
    initialState,
  )
  const isSpanish = language === "es"

  return (
    <Card className="border-[color:var(--brand-gold)] bg-white">
      <CardHeader>
        <CardTitle>
          {isSpanish
            ? "Registrar interés en Química IGCSE"
            : "Register interest in IGCSE Chemistry"}
        </CardTitle>
        <CardDescription>
          {isSpanish
            ? "Es un registro de interés, no una reserva inmediata. Contactaremos contigo para conocer las necesidades del alumno/a y formar el grupo adecuado."
            : "This is an interest register, not an instant booking. We will contact you to understand the student's needs and form the right group."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5 md:grid-cols-2">
          <input name="language" type="hidden" value={language} />

          {state.message ? (
            <p className="md:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="parentName">
              {isSpanish
                ? "Nombre del padre, madre o tutor/a"
                : "Parent or carer name"}
            </Label>
            <Input id="parentName" name="parentName" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="childFirstName">
              {isSpanish ? "Nombre del alumno/a" : "Student's first name"}
            </Label>
            <Input id="childFirstName" name="childFirstName" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              {isSpanish ? "Correo electrónico" : "Email address"}
            </Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {isSpanish ? "WhatsApp o teléfono" : "WhatsApp or phone"}
            </Label>
            <Input id="phone" name="phone" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolName">
              {isSpanish ? "Colegio" : "School"}
            </Label>
            <Input id="schoolName" name="schoolName" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolYear">
              {isSpanish ? "Curso escolar" : "School year"}
            </Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
              id="schoolYear"
              name="schoolYear"
            >
              <option value="" disabled>
                {isSpanish ? "Selecciona curso" : "Select year"}
              </option>
              <option>Year 10</option>
              <option>Year 11</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredSession">
              {isSpanish ? "Horario preferido" : "Preferred session"}
            </Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
              id="preferredSession"
              name="preferredSession"
            >
              <option value="" disabled>
                {isSpanish ? "Selecciona una opción" : "Select a preference"}
              </option>
              <option value="17:00-17:50">17:00–17:50</option>
              <option value="18:00-18:50">18:00–18:50</option>
              <option value="either">
                {isSpanish
                  ? "Cualquiera de los dos horarios"
                  : "Either session"}
              </option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">
              {isSpanish
                ? "¿Qué apoyo sería más útil?"
                : "What support would be most useful?"}{" "}
              <span className="text-muted-foreground">
                ({isSpanish ? "opcional" : "optional"})
              </span>
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder={
                isSpanish
                  ? "Por ejemplo: tema actual, conceptos difíciles, cálculos, repaso o preparación de exámenes."
                  : "For example: current topic, difficult concepts, calculations, revision or exam preparation."
              }
            />
          </div>

          <label className="flex gap-3 text-sm md:col-span-2">
            <input
              className="mt-1"
              name="consentContact"
              required
              type="checkbox"
            />
            {isSpanish
              ? "Acepto que The Afternoon Academy me contacte sobre esta consulta del Focus Group de Química IGCSE."
              : "I agree that The Afternoon Academy may contact me about this Chemistry Focus Group enquiry."}
          </label>

          <Button className="md:col-span-2" disabled={pending} type="submit">
            {pending ? (
              <>
                <LoaderCircle className="animate-spin" />
                {isSpanish ? "Registrando interés…" : "Registering interest…"}
              </>
            ) : isSpanish ? (
              "Registrar interés en Química IGCSE"
            ) : (
              "Register interest in IGCSE Chemistry"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
