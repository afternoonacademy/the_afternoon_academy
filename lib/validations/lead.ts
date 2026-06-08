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
    .min(3, "Child age must be at least 3")
    .max(18, "Child age must be 18 or under"),

  schoolYear: z.string().optional(),

  curriculum: z.enum([
    "british",
    "ib_international",
    "spanish",
    "other_not_sure",
  ]),

  supportNeeds: z.array(z.string()).min(1, "Select at least one support need"),

  preferredDays: z.array(z.string()).min(1, "Select at least one preferred day"),
  preferredTimes: z
    .array(z.string())
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
    message: "You need to agree to be contacted about the launch",
  }),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>