import { z } from "zod"

export const leadFormSchema = z.object({
  parentName: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(6, "Please enter a contact number"),
  area: z.string().optional(),
  schoolName: z.string().optional(),

  childAge: z.coerce
    .number()
    .int()
    .min(4, "The Afternoon Academy currently welcomes children aged 4–12")
    .max(12, "The Afternoon Academy currently welcomes children aged 4–12"),

  schoolYear: z.string().optional(),

  curriculum: z.enum([
    "british",
    "ib_international",
    "spanish",
    "other_not_sure",
  ]),

  supportNeeds: z.array(z.string()).min(1, "Select at least one support need"),

  preferredDays: z.array(z.enum(["monday", "tuesday", "thursday", "friday"]))
    .min(1, "Select at least one preferred day"),
  preferredTimes: z
    .array(z.enum(["17:00-17:50", "18:00-18:50"]))
    .min(1, "Select at least one preferred time"),

  preferredFrequency: z.enum([
    "one_day",
    "two_days",
    "three_days",
    "four_plus_days",
    "not_sure",
  ]),

  interestLevel: z.enum([
    "just_curious",
    "interested_timetable",
    "very_interested",
    "priority_launch",
  ]),

  notes: z.string().optional(),

  consentContact: z.literal(true, {
    message: "You need to agree to be contacted about your place enquiry",
  }),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>
