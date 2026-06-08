import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata = {
  title: "Message received",
  description: "Thank you for contacting The Afternoon Academy.",
}

export default function ContactThanksPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Message received</CardTitle>
          <CardDescription>
            Thank you for contacting The Afternoon Academy.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            We have received your message and will reply as soon as we can. If
            you are interested in joining the launch timetable, you can also
            share your preferred days and times on the homepage.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">Back to homepage</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/#timetable-form">Share timetable preferences</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}