"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { dayOptions, weekdayTimes, weekendDays, hourlySlots, frequencyOptions, weekendTimeValue, retainTimesForDays } from "@/lib/leads/enquiry-options.mjs"

export function AvailabilityFields({ days, times, frequency, onChange, language = "en", optional = false, showFrequency = true }: {
  days: string[]; times: string[]; frequency: string
  showFrequency?: boolean
  onChange: (value: { preferredDays: string[]; preferredTimes: string[]; preferredFrequency: string }) => void
  language?: "en" | "es"; optional?: boolean
}) {
  const es = language === "es"
  const set = (nextDays: string[], nextTimes = times, nextFrequency = frequency) =>
    onChange({ preferredDays: nextDays, preferredTimes: nextTimes, preferredFrequency: nextFrequency })
  const toggleTime = (value: string, checked: boolean) => set(days, checked ? [...new Set([...times, value])] : times.filter((item) => item !== value))
  return <div className="space-y-5">
    <fieldset className="space-y-3">
      <legend className="font-semibold">{es ? "Días que podrían funcionar" : "Days that could work"}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dayOptions.map((day) => <label key={day.value} className="flex items-center gap-3 rounded-md border p-3 text-sm">
          <Checkbox checked={days.includes(day.value)} onCheckedChange={(checked) => {
            const next = checked === true ? [...new Set([...days, day.value])] : days.filter((item) => item !== day.value)
            set(next, retainTimesForDays(next, times))
          }} />
          <span>{day[language]}</span>
        </label>)}
      </div>
    </fieldset>
    {days.some((day) => !weekendDays.includes(day)) && <fieldset className="space-y-3">
      <legend className="font-semibold">{es ? "Horario entre semana" : "Weekday session times"}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{weekdayTimes.map((time) => <label key={time} className="flex items-center gap-3 rounded-md border p-3 text-sm">
        <Checkbox checked={times.includes(time)} onCheckedChange={(checked) => toggleTime(time, checked === true)} />
        <span>{time.replace("-", "–")}</span>
      </label>)}</div>
    </fieldset>}
    {weekendDays.filter((day) => days.includes(day)).map((day) => <fieldset key={day} className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 font-semibold">{dayOptions.find((item) => item.value === day)?.[language]} — {es ? "¿Qué horario te vendría bien?" : "What time would be convenient for you?"}</legend>
      <p className="text-sm text-muted-foreground">{es ? "Estamos valorando la demanda. Estas sesiones aún no están disponibles; no es una reserva." : "We’re gauging demand. These sessions aren’t available yet; this is an enquiry."}</p>
      <label className="grid gap-2 text-sm">
        {es ? "Añade una o varias franjas de una hora" : "Add one or more hourly preferences"}
        <select className="h-10 w-full rounded-md border bg-background px-3" value="" onChange={(event) => { if (event.target.value) toggleTime(weekendTimeValue(day, event.target.value), true) }}>
          <option value="">{es ? "Selecciona una franja" : "Choose an hourly slot"}</option>
          {hourlySlots.map((slot) => <option key={slot} value={slot} disabled={times.includes(weekendTimeValue(day, slot))}>{slot.replace("-", "–")}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">{hourlySlots.filter((slot) => times.includes(weekendTimeValue(day, slot))).map((slot) => <button key={slot} type="button" className="rounded-md border bg-muted px-3 py-2 text-sm" aria-label={`${es ? "Eliminar" : "Remove"} ${day} ${slot}`} onClick={() => toggleTime(weekendTimeValue(day, slot), false)}>{slot.replace("-", "–")} ×</button>)}</div>
    </fieldset>)}
    {showFrequency && <label className="grid gap-2 text-sm font-medium">
      {es ? "¿Cuántas sesiones por semana?" : "How many sessions per week?"}
      <select className="h-10 w-full rounded-md border bg-background px-3" value={frequency} required={!optional} onChange={(event) => set(days, times, event.target.value)}>
        <option value="">{optional ? (es ? "Aún no se sabe" : "Not recorded yet") : (es ? "Selecciona una opción" : "Select one")}</option>
        {frequency && !frequencyOptions.some((item) => item.value === frequency) && <option value={frequency}>{frequency}</option>}
        {frequencyOptions.map((item) => <option key={item.value} value={item.value}>{item[language]}</option>)}
      </select>
    </label>}
  </div>
}
