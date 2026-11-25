import type { Metadata } from "next"
import { GuideHome } from "@/components/discovery/guide-home"

export const metadata: Metadata = {
  title: "Guías y recursos para familias en Madrid | The Afternoon Academy",
  description: "Consejos para familias, apoyo académico e información independiente sobre colegios y barrios de Madrid.",
  alternates: { canonical: "/es/guia", languages: { en: "/guide", es: "/es/guia" } },
}
export default function Page() {
  return <GuideHome lang="es" />
}
