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

function formatValue(value: string) {
  return value.replaceAll("_", " ")
}

function formatArray(values: string[]) {
  if (!values.length) return "Not provided"

  return values.map(formatValue).join(", ")
}

export function parentConfirmationEmailHtml(data: LeadEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <h1 style="color: #111827; margin-bottom: 12px;">Thank you for helping us shape the timetable</h1>

      <p>Hi ${data.parentName},</p>

      <p>
        Thank you for registering your interest in <strong>The Afternoon Academy</strong>.
        We have received your timetable preferences and will use parent responses to help shape our first launch sessions in Conde Orgaz.
      </p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Your submitted preferences</h2>

        <p><strong>Child age:</strong> ${data.childAge}</p>
        <p><strong>School year:</strong> ${data.schoolYear || "Not provided"}</p>
        <p><strong>Curriculum:</strong> ${formatValue(data.curriculum)}</p>
        <p><strong>Support needed:</strong> ${formatArray(data.supportNeeds)}</p>
        <p><strong>Preferred days:</strong> ${formatArray(data.preferredDays)}</p>
        <p><strong>Preferred times:</strong> ${formatArray(data.preferredTimes)}</p>
        <p><strong>Likely frequency:</strong> ${formatValue(data.preferredFrequency)}</p>
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
        <p><strong>Name:</strong> ${data.parentName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Area:</strong> ${data.area || "Not provided"}</p>
        <p><strong>School:</strong> ${data.schoolName || "Not provided"}</p>
      </div>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Child and timetable</h2>
        <p><strong>Child age:</strong> ${data.childAge}</p>
        <p><strong>School year:</strong> ${data.schoolYear || "Not provided"}</p>
        <p><strong>Curriculum:</strong> ${formatValue(data.curriculum)}</p>
        <p><strong>Support needed:</strong> ${formatArray(data.supportNeeds)}</p>
        <p><strong>Preferred days:</strong> ${formatArray(data.preferredDays)}</p>
        <p><strong>Preferred times:</strong> ${formatArray(data.preferredTimes)}</p>
        <p><strong>Likely frequency:</strong> ${formatValue(data.preferredFrequency)}</p>
        <p><strong>Interest level:</strong> ${formatValue(data.interestLevel)}</p>
        <p><strong>Notes:</strong> ${data.notes || "None"}</p>
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