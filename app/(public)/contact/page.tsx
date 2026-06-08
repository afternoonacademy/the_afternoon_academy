import Link from "next/link"

import { ContactForm } from "@/components/forms/contact-form"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Contact",
  description:
    "Contact The Afternoon Academy with questions about after-school academic support in Madrid.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border px-4 py-2 text-sm text-muted-foreground">
            Contact The Afternoon Academy
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Have a question before registering interest?
            </h1>

            <p className="text-lg text-muted-foreground">
              Send us a message if you would like to ask about age groups,
              curriculum support, location, private lessons, siblings or
              anything else before completing the timetable form.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-5">
            <h2 className="font-semibold">Looking for the timetable form?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If you already know you are interested, the most useful thing is
              to share your preferred days and times on the homepage.
            </p>
            <Button asChild className="mt-4">
              <Link href="/#timetable-form">
                Share preferred days and times
              </Link>
            </Button>
          </div>
        </div>

        <ContactForm />
      </section>
    </main>
  )
}