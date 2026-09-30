import Link from "next/link"
import { createLearner } from "@/actions/learners"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default async function NewLearnerPage() {
  const { data: leads } = await supabaseAdmin.from("parent_leads").select("id, parent_name, email").order("created_at", { ascending: false })
  return <div className="mx-auto max-w-3xl space-y-6">
    <div><Link href="/admin/learners" className="text-sm underline">Back to learners</Link><h2 className="mt-3 text-3xl font-bold tracking-tight">Create learner record</h2><p className="mt-2 text-muted-foreground">Record only what helps the team support this child. Do not use this space for diagnoses or unnecessary sensitive detail.</p></div>
    <Card><CardHeader><CardTitle>Starting point</CardTitle></CardHeader><CardContent>
      <form action={createLearner} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="firstName">Child&apos;s first name</Label><Input id="firstName" name="firstName" required /></div><div className="space-y-2"><Label htmlFor="yearGroup">Year group</Label><Input id="yearGroup" name="yearGroup" placeholder="e.g. Year 4" /></div></div>
        <div className="space-y-2"><Label htmlFor="parentLeadId">Link the original enquiry</Label><select id="parentLeadId" name="parentLeadId" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue=""><option value="">No linked enquiry</option>{leads?.map((lead) => <option key={lead.id} value={lead.id}>{lead.parent_name} — {lead.email}</option>)}</select></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="strengths">Strengths</Label><Input id="strengths" name="strengths" placeholder="Comma-separated, e.g. curious, kind" /></div><div className="space-y-2"><Label htmlFor="interests">Interests</Label><Input id="interests" name="interests" placeholder="Comma-separated, e.g. animals, art" /></div></div>
        <div className="space-y-2"><Label htmlFor="barriers">Current learning barriers</Label><Input id="barriers" name="barriers" placeholder="Use practical observations, not labels" /></div>
        <div className="space-y-2"><Label htmlFor="parentPriorities">Parent priorities</Label><Textarea id="parentPriorities" name="parentPriorities" placeholder="What the family hopes will improve first" /></div>
        <div className="space-y-2"><Label htmlFor="helpfulStrategies">What helps</Label><Textarea id="helpfulStrategies" name="helpfulStrategies" placeholder="Approaches already known to help this child engage" /></div>
        <label className="flex gap-3 rounded-md border p-3 text-sm"><input type="checkbox" name="parentInformationConfirmed" required /><span>I have confirmed that this information is relevant to supporting the child and may be recorded for TAA&apos;s educational service.</span></label>
        <p className="text-xs text-muted-foreground">AI processing is disabled for all learner records. No information entered here is sent to an AI service.</p><Button type="submit">Create learner record</Button>
      </form>
    </CardContent></Card>
  </div>
}