export const dayOptions = [
  { value: "monday", en: "Monday", es: "Lunes" },
  { value: "tuesday", en: "Tuesday", es: "Martes" },
  { value: "wednesday", en: "Wednesday", es: "Miércoles" },
  { value: "thursday", en: "Thursday", es: "Jueves" },
  { value: "friday", en: "Friday", es: "Viernes" },
  { value: "saturday", en: "Saturday", es: "Sábado" },
  { value: "sunday", en: "Sunday", es: "Domingo" },
]
export const weekdayTimes = ["17:00-17:50", "18:00-18:50"]
export const frequencyOptions = [
  { value: "one_day", en: "1 session per week", es: "1 sesión por semana" },
  { value: "two_days", en: "2 sessions per week", es: "2 sesiones por semana" },
  { value: "three_days", en: "3 sessions per week", es: "3 sesiones por semana" },
  { value: "four_plus_days", en: "4+ sessions per week", es: "4+ sesiones por semana" },
  { value: "not_sure", en: "Not sure yet", es: "No estoy seguro/a todavía" },
]
export const leadSources = ["whatsapp", "phone", "email", "referral", "walk_in", "other"]
export const weekendDays = ["saturday", "sunday"]
export const hourlySlots = Array.from({ length: 24 }, (_, hour) =>
  `${String(hour).padStart(2, "0")}:00-${String(hour + 1).padStart(2, "0")}:00`,
)
// Day-scoped preference tokens fit the existing text[]; they never create sessions.
export const weekendTimeValue = (day, slot) => `${day}@${slot}`
export const isWeekendDay = (day) => weekendDays.includes(day)
export function isEnquiryTime(value) {
  return weekdayTimes.includes(value) || weekendDays.some((day) =>
    hourlySlots.some((slot) => value === weekendTimeValue(day, slot)),
  )
}
export function retainTimesForDays(days, times) {
  return times.filter((time) => {
    const [day] = time.split("@")
    return isWeekendDay(day) ? days.includes(day) : days.some((item) => !isWeekendDay(item))
  })
}
export function missingTimeGroups(days, times) {
  const missing = []
  if (days.some((day) => !isWeekendDay(day)) && !times.some((time) => weekdayTimes.includes(time))) missing.push("weekday")
  for (const day of weekendDays) {
    if (days.includes(day) && !times.some((time) => time.startsWith(day + "@"))) missing.push(day)
  }
  return missing
}
export function formatEnquiryTime(value) {
  const [day, slot] = value.split("@")
  const label = dayOptions.find((item) => item.value === day)
  return slot && label ? `${label.en}: ${slot.replace("-", "–")}` : value.replace("-", "–")
}
