import test from "node:test"
import assert from "node:assert/strict"

import {
  canMarkFamilyDocumentSigned,
  canSendFamilyDocument,
  familyDocumentStatus,
  renderRegistrationAuthorisationEmail,
} from "../lib/admin/family-documents.mjs"

test("missing family document record is not sent", () => {
  assert.equal(familyDocumentStatus(null), "not_sent")
})

test("sent document remains awaiting signature until manually signed", () => {
  assert.equal(familyDocumentStatus({ status: "sent" }), "sent")
  assert.equal(canMarkFamilyDocumentSigned({ status: "sent" }), true)
})

test("signed document cannot be sent or marked signed again", () => {
  assert.equal(canSendFamilyDocument({ status: "signed" }), false)
  assert.equal(canMarkFamilyDocumentSigned({ status: "signed" }), false)
})

test("existing externally signed form can be recorded without an in-app send", () => {
  assert.equal(canMarkFamilyDocumentSigned(null), true)
})

test("registration email includes parent name and exact web form link", () => {
  const formUrl =
    "https://eu2.documents.adobe.com/public/esignWidget?wid=example*"
  const rendered = renderRegistrationAuthorisationEmail({
    parentName: "Anastasia Gibbons",
    subjectTemplate: "Please complete {{document_name}}",
    bodyTemplate:
      "Dear {{parent_name}},\n\nPlease complete the form here: {{form_link}}",
    formUrl,
  })

  assert.equal(
    rendered.subject,
    "Please complete Parent Registration & Authorisation Form",
  )
  assert.match(rendered.body, /Dear Anastasia Gibbons/)
  assert.match(
    rendered.body,
    /https:\/\/eu2\.documents\.adobe\.com\/public\/esignWidget\?wid=example\*/,
  )
})


test("registration template placeholders use the setup editor contract shape", async () => {
  const { registrationAuthorisationTemplateContract } = await import(
    "../lib/admin/family-documents.mjs"
  )

  assert.deepEqual(registrationAuthorisationTemplateContract.placeholders, [
    { key: "parent_name", description: "Parent or guardian name" },
    {
      key: "document_name",
      description: "Parent Registration & Authorisation Form",
    },
    { key: "form_link", description: "Secure Adobe web-form link" },
  ])
})
