import { headers } from "next/headers"

export async function getRequestOrigin() {
  const requestHeaders = await headers()
  const host =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host")
  const protocol = requestHeaders.get("x-forwarded-proto") || "https"

  if (host) return `${protocol}://${host}`

  return process.env.NEXT_PUBLIC_SITE_URL || "https://theafternoonacademy.com"
}
