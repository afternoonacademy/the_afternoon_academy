import type { Metadata } from "next"
import { GuideHome } from "@/components/discovery/guide-home"

export const metadata: Metadata = {
  title: "Helpful guides for parents in Madrid | The Afternoon Academy",
  description: "Practical parent resources, academic support guides and independent Madrid school and neighbourhood information from The Afternoon Academy.",
  alternates: { canonical: "/guide", languages: { en: "/guide", es: "/es/guia" } },
}
export default function Page() {
  return <GuideHome lang="en" />
}
