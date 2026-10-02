"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type LeadChildDraft = {
  key: number
  firstName: string
  age: string
  schoolName: string
  schoolYear: string
  curriculum: string
  supportNeeds: string[]
  courseOrExamBoard: string
  preferredDays: string[]
  preferredTimes: string[]
  preferredFrequency: string
  notes: string
}

const supportNeeds = [
  { value: "homework_help", en: "Homework help", es: "Apoyo con deberes" },
  { value: "reading", en: "Reading", es: "Lectura" },
  { value: "writing", en: "Writing", es: "Escritura" },
  { value: "maths", en: "Maths confidence", es: "Confianza en matemáticas" },
  { value: "english_confidence", en: "English confidence", es: "Confianza con el inglés" },
  { value: "homework_routine", en: "Homework routine", es: "Rutina de deberes" },
  { value: "general_support", en: "General homework / academic support", es: "Apoyo general con deberes / académico" },
  { value: "igcse_chemistry", en: "IGCSE Chemistry support", es: "Apoyo de Química IGCSE" },
  { value: "one_to_one", en: "1-to-1 support (subject to availability)", es: "Apoyo individual (según disponibilidad)" },
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

function toggleValue(values: string[], value: string, checked: boolean) {
  return checked
    ? [...new Set([...values, value])]
    : values.filter((item) => item !== value)
}

export function LeadChildFields({
  child,
  index,
  language,
  canRemove,
  onChange,
  onRemove,
}: {
  child: LeadChildDraft
  index: number
  language: "en" | "es"
  canRemove: boolean
  onChange: (next: LeadChildDraft) => void
  onRemove: () => void
}) {
  const isSpanish = language === "es"
  const hasIgcse = child.supportNeeds.includes("igcse_chemistry")
  const set = <K extends keyof LeadChildDraft>(key: K, value: LeadChildDraft[K]) =>
    onChange({ ...child, [key]: value })

  return (
    <section className="space-y-5 rounded-xl border bg-background p-4 md:p-5">
      <div className="flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-sm font-semibold text-primary">
            {isSpanish ? "Niño/a " + (index + 1) : "Child " + (index + 1)}
          </p>
          <h3 className="mt-1 text-lg font-bold">
            {child.firstName
              ? isSpanish
                ? "Cuéntanos qué apoyo necesita " + child.firstName
                : "Tell us what support " + child.firstName + " needs"
              : isSpanish
                ? "Datos y necesidades de este niño/a"
                : "This child’s details and needs"}
          </h3>
        </div>
        {canRemove ? (
          <Button onClick={onRemove} type="button" variant="outline" size="sm">
            {isSpanish ? "Eliminar" : "Remove child"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={"child-" + child.key + "-name"}>
            {isSpanish ? "Nombre" : "First name"}
          </Label>
          <Input
            id={"child-" + child.key + "-name"}
            value={child.firstName}
            onChange={(event) => set("firstName", event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={"child-" + child.key + "-age"}>
            {isSpanish ? "Edad" : "Age"}
          </Label>
          <Input
            id={"child-" + child.key + "-age"}
            min="4"
            max="18"
            type="number"
            value={child.age}
            onChange={(event) => set("age", event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={"child-" + child.key + "-school"}>
            {isSpanish ? "Colegio actual" : "Current school"}{" "}
            <span className="text-muted-foreground">
              ({isSpanish ? "opcional" : "optional"})
            </span>
          </Label>
          <Input
            id={"child-" + child.key + "-school"}
            value={child.schoolName}
            onChange={(event) => set("schoolName", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={"child-" + child.key + "-year"}>
            {isSpanish ? "Curso escolar" : "School year"}
          </Label>
          <Input
            id={"child-" + child.key + "-year"}
            value={child.schoolYear}
            onChange={(event) => set("schoolYear", event.target.value)}
            placeholder={isSpanish ? "p. ej. Year 6 / 5º Primaria" : "e.g. Year 6"}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={"child-" + child.key + "-curriculum"}>
            {isSpanish ? "Currículo" : "Curriculum"}
          </Label>
          <select
            id={"child-" + child.key + "-curriculum"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={child.curriculum}
            onChange={(event) => set("curriculum", event.target.value)}
            required
          >
            <option value="" disabled>{isSpanish ? "Selecciona una opción" : "Select one"}</option>
            <option value="british">{isSpanish ? "Currículo británico" : "British curriculum"}</option>
            <option value="ib_international">{isSpanish ? "IB / currículo internacional" : "IB / International curriculum"}</option>
            <option value="spanish">{isSpanish ? "Currículo español" : "Spanish curriculum"}</option>
            <option value="other_not_sure">{isSpanish ? "Otro / no estoy seguro/a" : "Other / not sure"}</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="font-semibold">
            {isSpanish ? "¿Qué apoyo necesita?" : "What support does this child need?"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isSpanish ? "Selecciona todo lo que corresponda a este niño/a." : "Select everything that applies to this child."}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {supportNeeds.map((item) => (
            <label key={item.value} className="flex items-center gap-3 rounded-md border p-3 text-sm">
              <Checkbox
                checked={child.supportNeeds.includes(item.value)}
                onCheckedChange={(checked) =>
                  set("supportNeeds", toggleValue(child.supportNeeds, item.value, checked === true))
                }
              />
              <span>{item[language]}</span>
            </label>
          ))}
        </div>
      </div>

      {hasIgcse ? (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <Label htmlFor={"child-" + child.key + "-exam-board"}>
            {isSpanish ? "Curso / exam board" : "Course / exam board"}{" "}
            <span className="text-muted-foreground">
              ({isSpanish ? "opcional" : "optional"})
            </span>
          </Label>
          <Input
            id={"child-" + child.key + "-exam-board"}
            value={child.courseOrExamBoard}
            onChange={(event) => set("courseOrExamBoard", event.target.value)}
            placeholder={isSpanish ? "p. ej. Cambridge, Edexcel" : "e.g. Cambridge, Edexcel"}
          />
        </div>
      ) : null}

      <div className="space-y-3">
        <div>
          <p className="font-semibold">{isSpanish ? "Días que podrían funcionar" : "Days that could work"}</p>
          <p className="text-sm text-muted-foreground">
            {isSpanish ? "Estas preferencias son solo para este niño/a." : "These preferences apply to this child only."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {days.map((day) => (
            <label key={day.value} className="flex items-center gap-3 rounded-md border p-3 text-sm">
              <Checkbox
                checked={child.preferredDays.includes(day.value)}
                onCheckedChange={(checked) =>
                  set("preferredDays", toggleValue(child.preferredDays, day.value, checked === true))
                }
              />
              <span>{day[language]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-semibold">{isSpanish ? "Horarios que podrían funcionar" : "Times that could work"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {times.map((time) => (
            <label key={time.value} className="flex items-center gap-3 rounded-md border p-3 text-sm">
              <Checkbox
                checked={child.preferredTimes.includes(time.value)}
                onCheckedChange={(checked) =>
                  set("preferredTimes", toggleValue(child.preferredTimes, time.value, checked === true))
                }
              />
              <span>{time.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={"child-" + child.key + "-frequency"}>
          {isSpanish ? "¿Cuántas sesiones por semana?" : "How many sessions would you like each week?"}
        </Label>
        <select
          id={"child-" + child.key + "-frequency"}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={child.preferredFrequency}
          onChange={(event) => set("preferredFrequency", event.target.value)}
          required
        >
          <option value="" disabled>{isSpanish ? "Selecciona una opción" : "Select one"}</option>
          <option value="one_day">{isSpanish ? "1 sesión por semana" : "1 session per week"}</option>
          <option value="two_days">{isSpanish ? "2 sesiones por semana" : "2 sessions per week"}</option>
          <option value="three_days">{isSpanish ? "3 sesiones por semana" : "3 sessions per week"}</option>
          <option value="four_plus_days">{isSpanish ? "4+ sesiones por semana" : "4+ sessions per week"}</option>
          <option value="not_sure">{isSpanish ? "No estoy seguro/a todavía" : "Not sure yet"}</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={"child-" + child.key + "-notes"}>
          {isSpanish ? "¿Algo más que debamos saber sobre este niño/a?" : "Anything else we should know about this child?"}
        </Label>
        <Textarea
          id={"child-" + child.key + "-notes"}
          value={child.notes}
          onChange={(event) => set("notes", event.target.value)}
          placeholder={isSpanish ? "Opcional: objetivos, asignaturas, dificultades concretas o contexto útil." : "Optional: goals, subjects, specific difficulties or useful context."}
        />
      </div>
    </section>
  )
}
