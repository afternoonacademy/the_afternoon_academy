import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import { Toaster } from "@/components/ui/sonner"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "The Afternoon Academy",
    template: "%s | The Afternoon Academy",
  },

  description:
    "British curriculum after-school support for children in Madrid. Help us shape our launch timetable in Arturo Soria.",

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  openGraph: {
    title: "The Afternoon Academy",
    description:
      "Structured after-school learning for children in Madrid, launching soon in Arturo Soria.",
    url: siteUrl,
    type: "website",
    locale: "en_GB",
    siteName: "The Afternoon Academy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Afternoon Academy - after-school academic support in Madrid",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "The Afternoon Academy",
    description:
      "Structured after-school learning for children in Madrid, launching soon in Arturo Soria.",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  )
}