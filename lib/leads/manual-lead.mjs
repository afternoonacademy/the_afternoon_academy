import { z } from "zod"
import { dayOptions, isEnquiryTime, frequencyOptions } from "./enquiry-options.mjs"

const text = (max) => z.string().trim().max(max).optional().default("")
export const optionalLeadEmail = z.union([z.string().trim().email().max(254), z.literal("")]).optional().default("")
export const optionalLeadAge = z.preprocess((value) => value === "" || value == null ? null : value, z.coerce.number().int().min(3).max(21).nullable())
export const manualChildLeadSchema = z.object({
  firstName: text(80), age: optionalLeadAge, schoolName: text(160), schoolYear: text(80),
  curriculum: text(120), supportNeeds: z.array(z.string().trim().min(1).max(80)).max(12).optional().default([]),
  courseOrExamBoard: text(120), notes: text(1200),
  preferredDays: z.array(z.enum(dayOptions.map((item) => item.value))).max(7).optional().default([]),
  preferredTimes: z.array(z.string().refine(isEnquiryTime, "Choose a valid time preference")).max(50).optional().default([]),
  preferredFrequency: z.union([z.enum(frequencyOptions.map((item) => item.value)), z.literal("")]).optional().default(""),
})
export const manualLeadSchema = z.object({
  parentName: text(160), email: optionalLeadEmail, phone: text(50), source: text(80),
  children: z.array(manualChildLeadSchema).min(1).max(6),
})
