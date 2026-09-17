"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Child = { key: number }

export function LeadAdditionalChildren({ language }: { language: "en" | "es" }) {
  const [children, setChildren] = useState<Child[]>([])
  const text = language === "es"
    ? { add: "Añadir otro niño/a", remove: "Eliminar", heading: "¿Otro niño/a de la familia?", note: "Añade el nombre, edad y curso de cada hermano/a que también necesita apoyo.", first: "Nombre", age: "Edad", year: "Curso" }
    : { add: "Add another child", remove: "Remove", heading: "Another child in the family?", note: "Add the name, age and school year of each sibling who may also need support.", first: "First name", age: "Age", year: "School year" }

  return <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
    <div><h4 className="font-medium">{text.heading}</h4><p className="text-sm text-muted-foreground">{text.note}</p></div>
    {children.map((child) => <div className="grid gap-3 sm:grid-cols-4" key={child.key}>
      <div className="sm:col-span-2"><Label htmlFor={`additional-child-name-${child.key}`}>{text.first}</Label><Input id={`additional-child-name-${child.key}`} name="additionalChildFirstName" required /></div>
      <div><Label htmlFor={`additional-child-age-${child.key}`}>{text.age}</Label><Input id={`additional-child-age-${child.key}`} max="12" min="4" name="additionalChildAge" required type="number" /></div>
      <div><Label htmlFor={`additional-child-year-${child.key}`}>{text.year}</Label><div className="flex gap-2"><Input id={`additional-child-year-${child.key}`} name="additionalChildSchoolYear" /><Button onClick={() => setChildren((current) => current.filter((item) => item.key !== child.key))} type="button" variant="outline">{text.remove}</Button></div></div>
    </div>)}
    <Button onClick={() => setChildren((current) => [...current, { key: Date.now() }])} type="button" variant="outline">+ {text.add}</Button>
  </section>
}