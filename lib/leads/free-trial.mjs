export const freeTrialPaths = {
  en: "/free-first-session",
  es: "/es/primera-sesion-gratis",
}

export const referralChoices = [
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
  return choice ? `Free first session · ${choice.en}` : null
}

export function marketingPartnerReferralId(referral) {
  if (typeof referral !== "string") return null
  return /^partner:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(referral)?.[1] ?? null
}

export function isFreeTrialSupport(value) {
  return value !== "one_to_one"
}
