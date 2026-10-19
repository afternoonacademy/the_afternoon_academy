import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot", "OAI-SearchBot"], allow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/", "/staff/", "/admin/", "/sign-in"] },
    ],
    sitemap: "https://www.theafternoonacademy.com/sitemap.xml",
  }
}
