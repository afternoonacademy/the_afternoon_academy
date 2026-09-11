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
            Your place enquiry has been received.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            We will review your enquiry for Calle Asura 40, Arturo Soria, and
            contact you to confirm availability and next steps.
          </p>

          <Button asChild>
            <Link href="/">Back to homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
