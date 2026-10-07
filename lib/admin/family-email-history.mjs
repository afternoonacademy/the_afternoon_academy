export const FAMILY_EMAIL_PAGE_SIZE = 25

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function assertCursorValue(value) {
  if (
    !value ||
    typeof value !== "object" ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    typeof value.id !== "string" ||
    !uuidPattern.test(value.id)
  ) {
    throw new Error("Invalid family email cursor")
  }
  return { createdAt: value.createdAt, id: value.id }
}

export function encodeFamilyEmailCursor(value) {
  return Buffer.from(JSON.stringify(assertCursorValue(value)), "utf8").toString("base64url")
}

export function decodeFamilyEmailCursor(cursor) {
  try {
    if (typeof cursor !== "string" || !cursor) throw new Error("invalid")
    const decoded = Buffer.from(cursor, "base64url").toString("utf8")
    return assertCursorValue(JSON.parse(decoded))
  } catch {
    throw new Error("Invalid family email cursor")
  }
}

export function buildFamilyEmailCursorFilter({ createdAt, id }) {
  const value = assertCursorValue({ createdAt, id })
  return `created_at.lt.${value.createdAt},and(created_at.eq.${value.createdAt},id.lt.${value.id})`
}

export function pageFamilyEmailRows(rows, pageSize = FAMILY_EMAIL_PAGE_SIZE) {
  const items = rows.slice(0, pageSize)
  const hasMore = rows.length > pageSize
  const last = items.at(-1)
  return {
    items,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeFamilyEmailCursor({ createdAt: last.created_at, id: last.id })
        : null,
  }
}
