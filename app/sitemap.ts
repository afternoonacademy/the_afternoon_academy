import type { MetadataRoute } from "next"
import { sections } from "@/lib/discovery/content"
import {guidePosts,localizedGuideSlug} from "@/lib/content/guide-posts"
import { freeTrialPaths } from "@/lib/leads/free-trial.mjs"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await guidePosts(true)
  const base = "https://www.theafternoonacademy.com"
  const routes = [
    "/",
    "/es",
    "/guide",
    "/es/guia",
    ...Object.values(freeTrialPaths),
    ...posts.flatMap(p=>["/guide/posts/"+localizedGuideSlug(p,"en"),"/es/guia/posts/"+localizedGuideSlug(p,"es")]),
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
