type LeadEmailData = {
  parentName: string
  email: string
  phone: string
  area?: string
  schoolName?: string

  childAge: number
  schoolYear?: string
  curriculum: string
  supportNeeds: string[]

  preferredDays: string[]
  preferredTimes: string[]
  preferredFrequency: string
  interestLevel: string

  notes?: string
}

type ContactEmailData = {
  name: string
  email: string
  phone?: string
  message: string
}

function formatValue(value: string) {
  return value.replaceAll("_", " ")
}

function formatArray(values: string[]) {
  if (!values.length) return "Not provided"

  return values.map(formatValue).join(", ")
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatMessageHtml(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br />")
}

export function parentConfirmationEmailHtml(data: LeadEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <h1 style="color: #111827; margin-bottom: 12px;">Thank you for helping us shape the timetable</h1>

      <p>Hi ${escapeHtml(data.parentName)},</p>

      <p>
        Thank you for registering your interest in <strong>The Afternoon Academy</strong>.
        We have received your timetable preferences and will use parent responses to help shape our first launch sessions in Conde Orgaz.
      </p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Your submitted preferences</h2>

        <p><strong>Child age:</strong> ${data.childAge}</p>
        <p><strong>School year:</strong> ${escapeHtml(data.schoolYear || "Not provided")}</p>
        <p><strong>Curriculum:</strong> ${escapeHtml(formatValue(data.curriculum))}</p>
        <p><strong>Support needed:</strong> ${escapeHtml(formatArray(data.supportNeeds))}</p>
        <p><strong>Preferred days:</strong> ${escapeHtml(formatArray(data.preferredDays))}</p>
        <p><strong>Preferred times:</strong> ${escapeHtml(formatArray(data.preferredTimes))}</p>
        <p><strong>Likely frequency:</strong> ${escapeHtml(formatValue(data.preferredFrequency))}</p>
      </div>

      <p>
        There is no commitment at this stage. We will be in touch once we can see which days, times and age groups have the strongest demand.
      </p>

      <p>
        Best wishes,<br />
        <strong>The Afternoon Academy</strong>
      </p>
    </div>
  `
}

export function parentConfirmationEmailText(data: LeadEmailData) {
  return `
Hi ${data.parentName},

Thank you for registering your interest in The Afternoon Academy.

We have received your timetable preferences and will use parent responses to help shape our first launch sessions in Conde Orgaz.

Your submitted preferences:

Child age: ${data.childAge}
School year: ${data.schoolYear || "Not provided"}
Curriculum: ${formatValue(data.curriculum)}
Support needed: ${formatArray(data.supportNeeds)}
Preferred days: ${formatArray(data.preferredDays)}
Preferred times: ${formatArray(data.preferredTimes)}
Likely frequency: ${formatValue(data.preferredFrequency)}

There is no commitment at this stage. We will be in touch once we can see which days, times and age groups have the strongest demand.

Best wishes,
The Afternoon Academy
  `.trim()
}

export function adminLeadNotificationEmailHtml(data: LeadEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 720px; margin: 0 auto;">
      <h1 style="color: #111827; margin-bottom: 12px;">New Afternoon Academy lead</h1>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Parent details</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.parentName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Area:</strong> ${escapeHtml(data.area || "Not provided")}</p>
        <p><strong>School:</strong> ${escapeHtml(data.schoolName || "Not provided")}</p>
      </div>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Child and timetable</h2>
        <p><strong>Child age:</strong> ${data.childAge}</p>
        <p><strong>School year:</strong> ${escapeHtml(data.schoolYear || "Not provided")}</p>
        <p><strong>Curriculum:</strong> ${escapeHtml(formatValue(data.curriculum))}</p>
        <p><strong>Support needed:</strong> ${escapeHtml(formatArray(data.supportNeeds))}</p>
        <p><strong>Preferred days:</strong> ${escapeHtml(formatArray(data.preferredDays))}</p>
        <p><strong>Preferred times:</strong> ${escapeHtml(formatArray(data.preferredTimes))}</p>
        <p><strong>Likely frequency:</strong> ${escapeHtml(formatValue(data.preferredFrequency))}</p>
        <p><strong>Interest level:</strong> ${escapeHtml(formatValue(data.interestLevel))}</p>
        <p><strong>Notes:</strong> ${escapeHtml(data.notes || "None")}</p>
      </div>
    </div>
  `
}

export function adminLeadNotificationEmailText(data: LeadEmailData) {
  return `
New Afternoon Academy lead

Parent details:
Name: ${data.parentName}
Email: ${data.email}
Phone: ${data.phone}
Area: ${data.area || "Not provided"}
School: ${data.schoolName || "Not provided"}

Child and timetable:
Child age: ${data.childAge}
School year: ${data.schoolYear || "Not provided"}
Curriculum: ${formatValue(data.curriculum)}
Support needed: ${formatArray(data.supportNeeds)}
Preferred days: ${formatArray(data.preferredDays)}
Preferred times: ${formatArray(data.preferredTimes)}
Likely frequency: ${formatValue(data.preferredFrequency)}
Interest level: ${formatValue(data.interestLevel)}
Notes: ${data.notes || "None"}
  `.trim()
}

export function adminContactNotificationEmailHtml(data: ContactEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 720px; margin: 0 auto;">
      <h1 style="color: #111827; margin-bottom: 12px;">New Afternoon Academy contact message</h1>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Contact details</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone || "Not provided")}</p>
      </div>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Message</h2>
        <p>${formatMessageHtml(data.message)}</p>
      </div>
    </div>
  `
}

export function adminContactNotificationEmailText(data: ContactEmailData) {
  return `
New Afternoon Academy contact message

Contact details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}

Message:
${data.message}
  `.trim()
}

export function parentContactConfirmationEmailHtml(data: ContactEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <h1 style="color: #111827; margin-bottom: 12px;">Thank you for contacting The Afternoon Academy</h1>

      <p>Hi ${escapeHtml(data.name)},</p>

      <p>
        Thank you for getting in touch. We have received your message and will reply as soon as we can.
      </p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Your message</h2>
        <p>${formatMessageHtml(data.message)}</p>
      </div>

      <p>
        Best wishes,<br />
        <strong>The Afternoon Academy</strong>
      </p>
    </div>
  `
}

export function parentContactConfirmationEmailText(data: ContactEmailData) {
  return `
Hi ${data.name},

Thank you for getting in touch with The Afternoon Academy.

We have received your message and will reply as soon as we can.

Your message:
${data.message}

Best wishes,
The Afternoon Academy
  `.trim()
}