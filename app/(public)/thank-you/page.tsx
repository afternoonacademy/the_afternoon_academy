import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Thank you</CardTitle>
          <CardDescription>
            Your timetable preferences have been received.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            We’re using parent responses to shape the first Afternoon Academy timetable. We’ll
            be in touch with launch information and availability once the strongest days, times
            and age groups are clear.
          </p>

          <Button asChild>
            <Link href="/">Back to homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

