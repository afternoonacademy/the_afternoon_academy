import type { MetadataRoute } from "next"
import { sections } from "@/lib/discovery/content"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.theafternoonacademy.com"
  const routes = [
    "/",
    "/es",
    "/guide",
    "/es/guia",
    ...Object.entries(sections).flatMap(([section, items]) =>
      items.map(item => ["/guide/" + section + "/" + item.slug, "/es/guia/" + section + "/" + item.slug]).flat()
    ),
  ]
  return routes.map(path => ({
    url: base + path,
    changeFrequency: "monthly",
    priority: path === "/" || path === "/es" ? 1 : path === "/guide" || path === "/es/guia" ? 0.8 : 0.6,
  }))
}
