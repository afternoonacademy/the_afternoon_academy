import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function UnauthorisedPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unauthorised</CardTitle>
          <CardDescription>
            This account does not have access to the admin dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button asChild className="w-full">
            <Link href="/">Back to homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
