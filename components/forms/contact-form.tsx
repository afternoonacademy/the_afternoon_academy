"use client"

import { useActionState } from "react"

import {
  submitContact,
  type SubmitContactState,
} from "@/actions/submit-contact"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialState: SubmitContactState = {
  success: false,
  message: "",
}

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContact,
    initialState
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Send us a message</CardTitle>
        <CardDescription>
          Use this for general questions about The Afternoon Academy. If you want
          to help us shape the timetable, please use the timetable form on the
          homepage.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          {state.message ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone / WhatsApp</Label>
              <Input id="phone" name="phone" placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              required
              rows={7}
              placeholder="Tell us what you would like to ask."
            />
          </div>

          <section className="space-y-4">
            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Checkbox name="consentContact" required />
              <span>
                I agree to be contacted about my enquiry.
              </span>
            </label>

            <p className="text-xs text-muted-foreground">
              We will only use your details to respond to your enquiry. We will
              not share your information with third parties.
            </p>
          </section>

          <Button type="submit" size="lg" disabled={isPending} className="w-full">
            {isPending ? "Sending..." : "Send message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}