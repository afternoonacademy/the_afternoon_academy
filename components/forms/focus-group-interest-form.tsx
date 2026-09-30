"use client"

import { useActionState } from "react"
import { LoaderCircle } from "lucide-react"
import { submitFocusGroupInterest, type FocusGroupInterestState } from "@/actions/submit-focus-group-interest"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialState: FocusGroupInterestState = { success: false, message: "" }
export function FocusGroupInterestForm() {
  const [state, action, pending] = useActionState(submitFocusGroupInterest, initialState)
  return <Card className="border-[color:var(--brand-gold)] bg-white"><CardHeader><CardTitle>Register interest in IGCSE Chemistry</CardTitle><CardDescription>This is an interest register, not an instant booking. We will contact you to understand the student&apos;s needs and form the right group.</CardDescription></CardHeader><CardContent><form action={action} className="grid gap-5 md:grid-cols-2">
    {state.message ? <p className="md:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{state.message}</p> : null}
    <div className="space-y-2"><Label htmlFor="parentName">Parent or carer name</Label><Input id="parentName" name="parentName" required /></div>
    <div className="space-y-2"><Label htmlFor="childFirstName">Student&apos;s first name</Label><Input id="childFirstName" name="childFirstName" required /></div>
    <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" required /></div>
    <div className="space-y-2"><Label htmlFor="phone">WhatsApp or phone</Label><Input id="phone" name="phone" required /></div>
    <div className="space-y-2"><Label htmlFor="schoolName">School</Label><Input id="schoolName" name="schoolName" required /></div>
    <div className="space-y-2"><Label htmlFor="schoolYear">School year</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" id="schoolYear" name="schoolYear" defaultValue=""><option value="" disabled>Select year</option><option>Year 10</option><option>Year 11</option></select></div>
    <div className="space-y-2"><Label htmlFor="preferredSession">Preferred session</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" id="preferredSession" name="preferredSession" defaultValue=""><option value="" disabled>Select a preference</option><option value="17:00-17:50">17:00–17:50</option><option value="18:00-18:50">18:00–18:50</option><option value="either">Either session</option></select></div>
    <div className="space-y-2"><Label htmlFor="courseOrExamBoard">Current course or exam board <span className="text-muted-foreground">(optional)</span></Label><Input id="courseOrExamBoard" name="courseOrExamBoard" placeholder="If known" /></div>
    <div className="space-y-2 md:col-span-2"><Label htmlFor="notes">What support would be most useful? <span className="text-muted-foreground">(optional)</span></Label><Textarea id="notes" name="notes" placeholder="For example: current topic, difficult concepts, calculations, revision or exam preparation." /></div>
    <label className="flex gap-3 text-sm md:col-span-2"><input className="mt-1" name="consentContact" type="checkbox" required />I agree that The Afternoon Academy may contact me about this Chemistry Focus Group enquiry.</label>
    <Button className="md:col-span-2" disabled={pending} type="submit">{pending ? <><LoaderCircle className="animate-spin" />Registering interest…</> : "Register interest in IGCSE Chemistry"}</Button>
  </form></CardContent></Card>
}
