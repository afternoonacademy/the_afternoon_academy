export const freeTrialPaths = {
  en: "/free-first-session",
  es: "/es/primera-sesion-gratis",
}

export const referralChoices = [
  { value: "scout-proel-334", en: "Scout Proel 334", es: "Grupo Scout Proel 334" },
  { value: "google", en: "Google Search or Maps", es: "Google o Google Maps" },
  { value: "social", en: "Social media", es: "Redes sociales" },
  { value: "recommendation", en: "Friend or family recommendation", es: "Recomendación de un amigo o familiar" },
  { value: "school", en: "School or parent association", es: "Colegio o asociación de familias" },
  { value: "local-group", en: "Local club or community group", es: "Club o asociación del barrio" },
  { value: "email", en: "Email from the Academy", es: "Correo de la academia" },
  { value: "flyer", en: "Flyer or poster", es: "Folleto o cartel" },
  { value: "other", en: "Other", es: "Otra opción" },
]

export function freeTrialLeadSource(referral) {
  const choice = referralChoices.find(({ value }) => value === referral)
  return choice ? `Free first session · ${choice.en}` : "Free first session"
}

export function isFreeTrialSupport(value) {
  return value !== "igcse_chemistry" && value !== "one_to_one"
}
