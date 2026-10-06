export const REGISTRATION_AUTHORISATION_DOCUMENT_KEY = "parent_registration_authorisation"
export const REGISTRATION_AUTHORISATION_DOCUMENT_NAME =
  "Parent Registration & Authorisation Form"
export const REGISTRATION_AUTHORISATION_FORM_URL =
  "https://eu2.documents.adobe.com/public/esignWidget?wid=CBFCIBAA3AAABLblqZhD34jK8yZqUdrNI8yh1nmScFaF3aB1q18dwhGTMGqGSSrHDCREcn5uSiSQ8z-jW5mk*"

export const registrationAuthorisationTemplateContract = {
  defaultSubject: "Please complete The Afternoon Academy parent registration form",
  defaultBody: `Dear {{parent_name}},

Please complete and sign The Afternoon Academy Parent Registration & Authorisation Form using the secure link below before your child's next session.

{{form_link}}

This form records the parent, emergency, medical/safety and collection information we need to support your child safely, together with the relevant authorisations.

If any details change after you submit the form, please let us know.

Thank you,
The Afternoon Academy`,
  placeholders: [
    { token: "{{parent_name}}", meaning: "Parent or guardian name" },
    { token: "{{document_name}}", meaning: "Parent Registration & Authorisation Form" },
    { token: "{{form_link}}", meaning: "Secure Adobe web-form link" },
  ],
}

export function familyDocumentStatus(record) {
  return record?.status || "not_sent"
}

export function canSendFamilyDocument(record) {
  return familyDocumentStatus(record) !== "signed"
}

export function canMarkFamilyDocumentSigned(record) {
  return familyDocumentStatus(record) !== "signed"
}

function applyTemplate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) =>
      result.replaceAll(`{{${key}}}`, String(value)),
    template,
  )
}

export function renderRegistrationAuthorisationEmail({
  parentName,
  subjectTemplate,
  bodyTemplate,
  formUrl = REGISTRATION_AUTHORISATION_FORM_URL,
}) {
  const values = {
    parent_name: parentName,
    document_name: REGISTRATION_AUTHORISATION_DOCUMENT_NAME,
    form_link: formUrl,
  }

  return {
    subject: applyTemplate(subjectTemplate, values),
    body: applyTemplate(bodyTemplate, values),
  }
}
