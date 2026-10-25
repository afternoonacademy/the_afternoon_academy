import { z } from "zod"

export const contactFormSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  message: z
    .string()
    .min(10, "Please add a little more detail to your message")
    .max(2000, "Please keep your message under 2000 characters"),
  consentContact: z.literal(true, {
    message: "You need to agree to be contacted about your enquiry",
  }),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>