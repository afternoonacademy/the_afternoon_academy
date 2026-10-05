export function initialPlanSessionOrigin(isOffPattern) {
  return isOffPattern ? "pre_agreed_exception" : "recurring"
}

export function customerFacingSessionSuffix(session) {
  if (session?.sessionOrigin === "pre_agreed_exception") return ""
  return session?.replacement ? " · replacement" : ""
}
