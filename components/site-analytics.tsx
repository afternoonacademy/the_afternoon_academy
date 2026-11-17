"use client"

import { usePathname } from "next/navigation"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"

export function SiteAnalytics() {
  const pathname = usePathname()
  // Authentication links and email addresses must never reach analytics.
  if (pathname.startsWith("/auth") || pathname.startsWith("/staff") || pathname === "/sign-in" || pathname === "/sign-up") return null
  return <>
    <Analytics />
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-YRGHJMDL58" strategy="afterInteractive" />
    <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "G-YRGHJMDL58");`}</Script>
  </>
}
