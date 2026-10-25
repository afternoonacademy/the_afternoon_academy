function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function renderLearningUpdateEmail({ subject, body }) {
  const cleanSubject = String(subject || "").trim()
  const cleanBody = String(body || "").trim()
  if (!cleanSubject || !cleanBody) {
    throw new Error("Subject and message are required")
  }

  return {
    subject: cleanSubject,
    text: cleanBody,
    html: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#20304a;line-height:1.6">${escapeHtml(cleanBody).replaceAll("\n", "<br />")}</main>`,
  }
}
