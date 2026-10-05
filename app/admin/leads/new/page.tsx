import Link from "next/link"

import { ManualFamilyLeadForm } from "@/components/admin/manual-family-lead-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewFamilyLeadPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Family pipeline</p>
          <h2 className="text-3xl font-bold">Add family lead</h2>
          <p className="mt-1 text-muted-foreground">
            Record a phone, email, referral or walk-in enquiry. Add each child
            separately so their support needs and timetable preferences stay
            independent.
          </p>
        </div>

        <Link
          className="text-sm font-semibold text-primary hover:underline"
          href="/admin/leads"
        >
          ← Back to pipeline
        </Link>
      </div>

      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle>Parent and child details</CardTitle>
        </CardHeader>
        <CardContent>
          <ManualFamilyLeadForm />
        </CardContent>
      </Card>
    </div>
  )
}
