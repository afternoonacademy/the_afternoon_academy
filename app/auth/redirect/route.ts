import { NextResponse } from "next/server"

// All login methods use the same invitation-aware admission and role routing.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/auth/callback", request.url))
}
