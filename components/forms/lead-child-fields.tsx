"use client"

import { isFreeTrialSupport } from "@/lib/leads/free-trial.mjs"

import { AvailabilityFields } from "@/components/forms/availability-fields"
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
  optional = false,
  freeTrial = false,
}: {
  optional?: boolean
  freeTrial?: boolean
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
            required={!optional}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={"child-" + child.key + "-age"}>
            {isSpanish ? "Edad" : "Age"}
          </Label>
          <Input
            id={"child-" + child.key + "-age"}
            min={optional ? "3" : "4"}
            max={freeTrial ? "12" : optional ? "21" : "18"}
            type="number"
            value={child.age}
            onChange={(event) => set("age", event.target.value)}
            required={!optional}
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
            required={!optional}
          >
            <option value="" disabled={!optional}>{isSpanish ? "Selecciona una opción" : "Select one"}</option>
            {child.curriculum && !["british", "ib_international", "spanish", "other_not_sure"].includes(child.curriculum) && <option value={child.curriculum}>{child.curriculum}</option>}
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
          {[...supportNeeds, ...child.supportNeeds.filter((value) => !supportNeeds.some((item) => item.value === value)).map((value) => ({ value, en: value, es: value }))].filter((item) => !freeTrial || isFreeTrialSupport(item.value)).map((item) => (
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

      <AvailabilityFields days={child.preferredDays} times={child.preferredTimes} frequency={child.preferredFrequency}
        language={language} optional={optional} showFrequency={!freeTrial} onChange={(availability) => onChange({ ...child, ...availability })} />

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
