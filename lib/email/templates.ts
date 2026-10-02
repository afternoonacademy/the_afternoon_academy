type EmailLanguage = "en" | "es"

type LeadEmailChild = {
  firstName: string
  age: number
  schoolName?: string
  schoolYear?: string
  curriculum: string
  supportNeeds: string[]
  courseOrExamBoard?: string
  preferredDays: string[]
  preferredTimes: string[]
  preferredFrequency: string
  notes?: string
}

type LeadEmailData = {
  parentName: string
  email: string
  phone: string
  area?: string
  children: LeadEmailChild[]
  interestLevel: string
  language?: EmailLanguage
}

type ContactEmailData = {
  name: string
  email: string
  phone?: string
  message: string
  language?: EmailLanguage
}

type FocusGroupInterestEmailData = {
  parentName: string
  email: string
  phone: string
  childFirstName: string
  schoolName: string
  schoolYear: "Year 10" | "Year 11"
  preferredSession: "17:00-17:50" | "18:00-18:50" | "either"
  notes?: string
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

function getLanguageLabel(language?: EmailLanguage) {
  return language === "es" ? "Spanish page" : "English page"
}

function leadChildrenHtml(data: LeadEmailData) {
  return data.children
    .map(
      (child, index) => `
        <div style="border-top:1px solid #e5e7eb;padding-top:14px;margin-top:14px;">
          <p><strong>Child ${index + 1}:</strong> ${escapeHtml(child.firstName)}</p>
          <p><strong>Age:</strong> ${child.age}</p>
          <p><strong>School:</strong> ${escapeHtml(child.schoolName || "Not provided")}</p>
          <p><strong>School year:</strong> ${escapeHtml(child.schoolYear || "Not provided")}</p>
          <p><strong>Curriculum:</strong> ${escapeHtml(formatValue(child.curriculum))}</p>
          <p><strong>Support needed:</strong> ${escapeHtml(formatArray(child.supportNeeds))}</p>
          ${child.courseOrExamBoard ? `<p><strong>Course / exam board:</strong> ${escapeHtml(child.courseOrExamBoard)}</p>` : ""}
          <p><strong>Preferred days:</strong> ${escapeHtml(formatArray(child.preferredDays))}</p>
          <p><strong>Preferred times:</strong> ${escapeHtml(formatArray(child.preferredTimes))}</p>
          <p><strong>Likely frequency:</strong> ${escapeHtml(formatValue(child.preferredFrequency))}</p>
          <p><strong>Notes:</strong> ${escapeHtml(child.notes || "None")}</p>
        </div>
      `,
    )
    .join("")
}

function leadChildrenText(data: LeadEmailData) {
  return data.children
    .map(
      (child, index) =>
        [
          `Child ${index + 1}: ${child.firstName}`,
          `Age: ${child.age}`,
          `School: ${child.schoolName || "Not provided"}`,
          `School year: ${child.schoolYear || "Not provided"}`,
          `Curriculum: ${formatValue(child.curriculum)}`,
          `Support needed: ${formatArray(child.supportNeeds)}`,
          child.courseOrExamBoard ? `Course / exam board: ${child.courseOrExamBoard}` : null,
          `Preferred days: ${formatArray(child.preferredDays)}`,
          `Preferred times: ${formatArray(child.preferredTimes)}`,
          `Likely frequency: ${formatValue(child.preferredFrequency)}`,
          `Notes: ${child.notes || "None"}`,
        ]
          .filter(Boolean)
          .join("\n"),
    )
    .join("\n\n")
}

function formatFocusGroupSession(session: FocusGroupInterestEmailData["preferredSession"]) {
  return session === "either" ? "Either 17:00–17:50 or 18:00–18:50" : session.replace("-", "–")
}

export function focusGroupInterestConfirmationEmailHtml(data: FocusGroupInterestEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <h1 style="color: #111827; margin-bottom: 12px;">We received your IGCSE Chemistry interest registration</h1>

      <p>Hi ${escapeHtml(data.parentName)},</p>

      <p>
        Thank you for registering interest in the <strong>IGCSE Chemistry Focus Group</strong> at The Afternoon Academy.
        We will review the group fit and get in touch about the appropriate next step.
      </p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Your registration</h2>
        <p><strong>Student:</strong> ${escapeHtml(data.childFirstName)}</p>
        <p><strong>School:</strong> ${escapeHtml(data.schoolName)}</p>
        <p><strong>Year:</strong> ${escapeHtml(data.schoolYear)}</p>
        <p><strong>Preferred session:</strong> ${escapeHtml(formatFocusGroupSession(data.preferredSession))}</p>
      </div>

      <p>
        This is an interest registration only. It does not reserve or confirm a place, and no payment is required at this stage.
      </p>

      <p>
        Best wishes,<br />
        <strong>The Afternoon Academy</strong>
      </p>
    </div>
  `
}

export function focusGroupInterestConfirmationEmailText(data: FocusGroupInterestEmailData) {
  return `
Hi ${data.parentName},

Thank you for registering interest in the IGCSE Chemistry Focus Group at The Afternoon Academy.

We will review the group fit and get in touch about the appropriate next step.

Your registration:
Student: ${data.childFirstName}
School: ${data.schoolName}
Year: ${data.schoolYear}
Preferred session: ${formatFocusGroupSession(data.preferredSession)}

This is an interest registration only. It does not reserve or confirm a place, and no payment is required at this stage.

Best wishes,
The Afternoon Academy
  `.trim()
}

export function focusGroupAdminNotificationEmailHtml(data: FocusGroupInterestEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 720px; margin: 0 auto;">
      <h1 style="color: #111827; margin-bottom: 12px;">New IGCSE Chemistry Focus Group enquiry</h1>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Parent details</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.parentName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
      </div>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Student and group preference</h2>
        <p><strong>Focus Group:</strong> IGCSE Chemistry</p>
        <p><strong>Student:</strong> ${escapeHtml(data.childFirstName)}</p>
        <p><strong>School:</strong> ${escapeHtml(data.schoolName)}</p>
        <p><strong>Year:</strong> ${escapeHtml(data.schoolYear)}</p>
        <p><strong>Preferred session:</strong> ${escapeHtml(formatFocusGroupSession(data.preferredSession))}</p>
        <p><strong>Support context:</strong> ${formatMessageHtml(data.notes || "None provided")}</p>
      </div>
    </div>
  `
}

export function focusGroupAdminNotificationEmailText(data: FocusGroupInterestEmailData) {
  return `
New IGCSE Chemistry Focus Group enquiry

Parent details:
Name: ${data.parentName}
Email: ${data.email}
Phone: ${data.phone}

Student and group preference:
Focus Group: IGCSE Chemistry
Student: ${data.childFirstName}
School: ${data.schoolName}
Year: ${data.schoolYear}
Preferred session: ${formatFocusGroupSession(data.preferredSession)}
Support context: ${data.notes || "None provided"}
  `.trim()
}

export function parentConfirmationEmailHtml(data: LeadEmailData) {
  const intro =
    data.language === "es"
      ? "Hemos recibido tu solicitud de plaza. Revisaremos las necesidades de cada niño/a y te contactaremos para confirmar disponibilidad y próximos pasos."
      : "We received your place enquiry. We will review each child’s needs and contact you to confirm availability and next steps."

  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <h1 style="color: #111827; margin-bottom: 12px;">${data.language === "es" ? "Hemos recibido tu solicitud de plaza" : "We received your place enquiry"}</h1>
      <p>${data.language === "es" ? "Hola" : "Hi"} ${escapeHtml(data.parentName)},</p>
      <p>${escapeHtml(intro)}</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:24px 0;">
        <h2 style="font-size:18px;margin-top:0;">${data.language === "es" ? "Niños/as incluidos en la solicitud" : "Children included in the enquiry"}</h2>
        ${leadChildrenHtml(data)}
      </div>
      <p>${data.language === "es" ? "Esto no confirma una plaza todavía." : "This does not confirm a place yet."}</p>
      <p>${data.language === "es" ? "Un saludo" : "Best wishes"},<br /><strong>The Afternoon Academy</strong></p>
    </div>
  `
}

export function parentConfirmationEmailText(data: LeadEmailData) {
  return `
${data.language === "es" ? "Hola" : "Hi"} ${data.parentName},

${data.language === "es" ? "Hemos recibido tu solicitud de plaza. Revisaremos las necesidades de cada niño/a y te contactaremos para confirmar disponibilidad y próximos pasos." : "We received your place enquiry. We will review each child’s needs and contact you to confirm availability and next steps."}

${leadChildrenText(data)}

${data.language === "es" ? "Esto no confirma una plaza todavía." : "This does not confirm a place yet."}

${data.language === "es" ? "Un saludo" : "Best wishes"},
The Afternoon Academy
  `.trim()
}

export function adminLeadNotificationEmailHtml(data: LeadEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 720px; margin: 0 auto;">
      <h1 style="color:#111827;margin-bottom:12px;">New Afternoon Academy place enquiry</h1>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:24px 0;">
        <h2 style="font-size:18px;margin-top:0;">Parent details</h2>
        <p><strong>Source language:</strong> ${escapeHtml(getLanguageLabel(data.language))}</p>
        <p><strong>Name:</strong> ${escapeHtml(data.parentName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Area:</strong> ${escapeHtml(data.area || "Not provided")}</p>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:24px 0;">
        <h2 style="font-size:18px;margin-top:0;">Child-specific requirements</h2>
        ${leadChildrenHtml(data)}
      </div>
    </div>
  `
}

export function adminLeadNotificationEmailText(data: LeadEmailData) {
  return `
New Afternoon Academy place enquiry

Source language: ${getLanguageLabel(data.language)}

Parent details:
Name: ${data.parentName}
Email: ${data.email}
Phone: ${data.phone}
Area: ${data.area || "Not provided"}

Child-specific requirements:
${leadChildrenText(data)}

Interest level: ${formatValue(data.interestLevel)}
  `.trim()
}

export function adminContactNotificationEmailHtml(data: ContactEmailData) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 720px; margin: 0 auto;">
      <h1 style="color: #111827; margin-bottom: 12px;">New Afternoon Academy contact message</h1>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <h2 style="font-size: 18px; margin-top: 0;">Contact details</h2>
        <p><strong>Source language:</strong> ${escapeHtml(getLanguageLabel(data.language))}</p>
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

Source language: ${getLanguageLabel(data.language)}

Contact details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}

Message:
${data.message}
  `.trim()
}

export function parentContactConfirmationEmailHtml(data: ContactEmailData) {
  if (data.language === "es") {
    return `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 640px; margin: 0 auto;">
        <h1 style="color: #111827; margin-bottom: 12px;">Gracias por contactar con The Afternoon Academy</h1>

        <p>Hola ${escapeHtml(data.name)},</p>

        <p>
          Gracias por escribirnos. Hemos recibido tu mensaje y te responderemos lo antes posible.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <h2 style="font-size: 18px; margin-top: 0;">Tu mensaje</h2>
          <p>${formatMessageHtml(data.message)}</p>
        </div>

        <p>
          Un saludo,<br />
          <strong>The Afternoon Academy</strong>
        </p>
      </div>
    `
  }

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
  if (data.language === "es") {
    return `
Hola ${data.name},

Gracias por contactar con The Afternoon Academy.

Hemos recibido tu mensaje y te responderemos lo antes posible.

Tu mensaje:
${data.message}

Un saludo,
The Afternoon Academy
    `.trim()
  }

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
