import { redirect } from "next/navigation"

import { requireCapability } from "@/lib/auth/require-capability"

export default async function AdminHomePage() {
  const { internalUser } = await requireCapability("view_operations")
  redirect(internalUser.role === "admin" ? "/admin/finance" : "/admin/operations")
}
