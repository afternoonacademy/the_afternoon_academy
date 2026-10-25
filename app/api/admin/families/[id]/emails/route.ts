import { NextResponse } from "next/server"
import { z } from "zod"

import { loadFamilyEmailPage } from "@/lib/admin/load-family-emails"
import { requireCapability } from "@/lib/auth/require-capability"

const paramsSchema = z.object({ id: z.string().uuid() })

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  await requireCapability("view_family_pipeline")

  const parsed = paramsSchema.safeParse(await context.params)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid family" }, { status: 400 })
  }

  const cursor = new URL(request.url).searchParams.get("cursor")

  try {
    const page = await loadFamilyEmailPage({
      parentLeadId: parsed.data.id,
      cursor,
    })
    return NextResponse.json(page)
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid family email cursor") {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Could not load older family emails" },
      { status: 500 },
    )
  }
}
