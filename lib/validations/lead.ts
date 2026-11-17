import { z } from "zod"
import { isEnquiryTime, missingTimeGroups, retainTimesForDays } from "../leads/enquiry-options.mjs"

export const supportNeedValues = [
  "homework_help",
  "reading",
  "writing",
  "maths",
  "english_confidence",
  "homework_routine",
  "general_support",
  "igcse_chemistry",
  "one_to_one",
] as const

export const childLeadFormSchema = z.object({
  firstName: z.string().trim().min(1, "Please enter your child’s first name").max(80),
  age: z.coerce
    .number()
    .int()
    .min(4, "The Afternoon Academy currently welcomes children aged 4–12")
    .max(18, "Please check your child’s age"),
  schoolName: z.string().trim().max(160).optional(),
  schoolYear: z.string().trim().max(80).optional(),
  curriculum: z.enum([
    "british",
    "ib_international",
    "spanish",
    "other_not_sure",
  ]),
  supportNeeds: z
    .array(z.enum(supportNeedValues))
    .min(1, "Select at least one support need"),
  courseOrExamBoard: z.string().trim().max(120).optional(),
  preferredDays: z
    .array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]))
    .min(1, "Select at least one preferred day"),
  preferredTimes: z
    .array(z.string().refine(isEnquiryTime, "Choose a valid time preference"))
    .max(50)
    .min(1, "Select at least one preferred time"),
  preferredFrequency: z.enum([
    "one_day",
    "two_days",
    "three_days",
    "four_plus_days",
    "not_sure",
  ]),
  notes: z.string().trim().max(1200).optional(),
}).superRefine((child, context) => {
  for (const group of missingTimeGroups(child.preferredDays, child.preferredTimes)) {
    context.addIssue({ code: "custom", path: ["preferredTimes"], message: `Choose at least one ${group} time preference` })
  }
  if (retainTimesForDays(child.preferredDays, child.preferredTimes).length !== child.preferredTimes.length) {
    context.addIssue({ code: "custom", path: ["preferredTimes"], message: "Choose times only for your selected days" })
  }
})

export const leadFormSchema = z.object({
  parentName: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(6, "Please enter a contact number"),
  area: z.string().trim().max(160).optional(),
  children: z
    .array(childLeadFormSchema)
    .min(1, "Add at least one child")
    .max(6, "Please contact us directly for enquiries covering more than six children"),
  interestLevel: z.enum([
    "just_curious",
    "interested_timetable",
    "very_interested",
    "priority_launch",
  ]),
  consentContact: z.literal(true, {
    message: "You need to agree to be contacted about your place enquiry",
  }),
})

export type ChildLeadFormValues = z.infer<typeof childLeadFormSchema>
export type LeadFormValues = z.infer<typeof leadFormSchema>
