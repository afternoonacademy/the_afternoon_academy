"use client"

import { useActionState } from "react"

import { submitLead, type SubmitLeadState } from "@/actions/submit-lead"
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

const initialState: SubmitLeadState = {
  success: false,
  message: "",
}

const supportNeeds = [
  { value: "homework_help", label: "Homework help" },
  { value: "reading", label: "Reading" },
  { value: "writing", label: "Writing" },
  { value: "maths", label: "Maths confidence" },
  { value: "english_confidence", label: "English confidence" },
  { value: "study_routine", label: "Study routine" },
  { value: "exam_prep", label: "Exam preparation" },
  { value: "general_support", label: "General academic support" },
]

const days = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
]

const times = [
  { value: "16:30", label: "16:30-17:30" },
  { value: "17:00", label: "17:00-18:00" },
  { value: "17:30", label: "17:30-18:30" },
  { value: "18:00", label: "18:00-19:00" },
]

export function LeadForm() {
  const [state, formAction, isPending] = useActionState(
    submitLead,
    initialState
  )

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Help us shape the timetable</CardTitle>
        <CardDescription>
          Tell us your preferred days and times. There is no commitment at this
          stage.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-8">
          {state.message ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">Parent details</h3>
              <p className="text-sm text-muted-foreground">
                We will only use this to contact you about launch information
                and availability.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent name</Label>
                <Input id="parentName" name="parentName" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp / phone</Label>
                <Input id="phone" name="phone" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  name="area"
                  placeholder="e.g. Conde Orgaz, Arturo Soria"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="schoolName">Child's current school name</Label>
                <Input id="schoolName" name="schoolName" placeholder="Optional" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">Child details</h3>
              <p className="text-sm text-muted-foreground">
                We only need basic details at this stage.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="childAge">Child age</Label>
                <Input
                  id="childAge"
                  name="childAge"
                  type="number"
                  min="3"
                  max="18"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolYear">School year</Label>
                <Input id="schoolYear" name="schoolYear" placeholder="Optional" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="curriculum">Curriculum</Label>
                <select
                  id="curriculum"
                  name="curriculum"
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  <option value="british">British curriculum</option>
                  <option value="ib_international">
                    IB / International curriculum
                  </option>
                  <option value="spanish">Spanish curriculum</option>
                  <option value="other_not_sure">Other / not sure</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">Support needed</h3>
              <p className="text-sm text-muted-foreground">
                Select everything that may be useful.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {supportNeeds.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-3 rounded-md border p-3 text-sm"
                >
                  <Checkbox name="supportNeeds" value={item.value} />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">Preferred days</h3>
              <p className="text-sm text-muted-foreground">
                Choose the days that could work for your family.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              {days.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-3 rounded-md border p-3 text-sm"
                >
                  <Checkbox name="preferredDays" value={day.value} />
                  <span>{day.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">Preferred times</h3>
              <p className="text-sm text-muted-foreground">
                Choose all times that may work.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {times.map((time) => (
                <label
                  key={time.value}
                  className="flex items-center gap-3 rounded-md border p-3 text-sm"
                >
                  <Checkbox name="preferredTimes" value={time.value} />
                  <span>{time.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preferredFrequency">
                How often might your child attend?
              </Label>
              <select
                id="preferredFrequency"
                name="preferredFrequency"
                required
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Select one
                </option>
                <option value="one_day">1 session per week</option>
                <option value="two_days">2 sessions per week</option>
                <option value="three_days">3 sessions per week</option>
                <option value="four_plus_days">4+ sessions per week</option>
                <option value="not_sure">Not sure yet</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestLevel">Interest level</Label>
              <select
                id="interestLevel"
                name="interestLevel"
                required
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Select one
                </option>
                <option value="priority_launch">
                  I would like to join if the times work
                </option>
                <option value="very_interested">
                  Very interested, but I need more information
                </option>
                <option value="interested_timetable">
                  Interested depending on timetable
                </option>
                <option value="just_curious">
                  I am just exploring options
                </option>
              </select>
            </div>
          </section>

          <section className="space-y-2">
            <Label htmlFor="notes">Anything else we should know?</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Optional - for example, siblings, ideal days, or specific support needed."
            />
          </section>

          <section className="space-y-4">
            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Checkbox name="consentContact" required />
              <span>
                I agree to be contacted about The Afternoon Academy launch,
                timetable and availability.
              </span>
            </label>

            <p className="text-xs text-muted-foreground">
              We will only use your details to contact you about The Afternoon
              Academy. We will not share your information with third parties.
            </p>
          </section>

          <Button type="submit" size="lg" disabled={isPending} className="w-full">
            {isPending ? "Submitting..." : "Submit timetable preferences"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}