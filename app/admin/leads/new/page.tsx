import Link from "next/link";

import { createManualLead } from "@/actions/update-lead-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewFamilyLeadPage() {
  return <div className="mx-auto max-w-3xl space-y-6 pb-10"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">Family pipeline</p><h2 className="text-3xl font-bold">Add family lead</h2><p className="mt-1 text-muted-foreground">Record a phone, email, referral or walk-in enquiry.</p></div><Link className="text-sm font-semibold text-primary hover:underline" href="/admin/leads">← Back to pipeline</Link></div><Card className="border-indigo-100"><CardHeader><CardTitle>Parent and child details</CardTitle></CardHeader><CardContent><form action={createManualLead} className="grid gap-4 md:grid-cols-2"><div><Label>Parent name</Label><Input name="parentName" required /></div><div><Label>Email</Label><Input name="email" type="email" required /></div><div><Label>Phone</Label><Input name="phone" /></div><div><Label>Source</Label><select name="source" className="h-10 w-full rounded-md border bg-background px-3" defaultValue="phone"><option value="phone">Phone</option><option value="email">Email</option><option value="referral">Referral</option><option value="walk_in">Walk-in</option><option value="other">Other</option></select></div><div><Label>Child first name</Label><Input name="childFirstName" required /></div><div><Label>Child age</Label><Input name="childAge" type="number" min="4" max="18" required /></div><div><Label>School year</Label><Input name="schoolYear" /></div><div className="flex items-end"><Button className="w-full">Add to family pipeline</Button></div></form></CardContent></Card></div>;
}
