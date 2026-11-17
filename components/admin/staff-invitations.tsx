import { requireAdmin } from "@/lib/auth/require-admin"
import { supabaseService } from "@/lib/supabase/service"
import { approveStaffInvitation, withdrawStaffInvitation } from "@/actions/staff-auth"
import { SaveActionForm } from "@/components/admin/save-action-form"
import { Input } from "@/components/ui/input"

export async function StaffInvitations() {
  await requireAdmin()
  const { data, error } = await supabaseService().from("staff_invitations")
    .select("id,email,name,role,status,expires_at,delivery_status").order("approved_at", { ascending: false }).limit(100)
  return <section className="brand-card max-w-4xl space-y-5 p-6">
    <h3 className="text-xl font-bold">Staff access</h3>
    <p className="text-sm text-muted-foreground">Approve an email, then ask that person to open /staff/sign-up. They receive a secure email link. Approval alone sends no email. Pending approval lasts seven days. Admin has full internal access; Teacher has teaching and Operations access.</p>
    {error ? <p role="alert">Staff invitations are unavailable. Complete the reviewed database migration before using this feature.</p> : <>
      <SaveActionForm action={approveStaffInvitation} submitLabel="Approve staff email" successMessage="Email approved. Share the staff signup page with your colleague.">
        <label className="grid gap-2">Name (optional)<Input name="name" maxLength={120} /></label>
        <label className="grid gap-2">Email<Input name="email" type="email" maxLength={254} required /></label>
        <label className="grid gap-2">Access level<select name="role" defaultValue="teacher" className="h-10 rounded-md border bg-background px-3"><option value="teacher">Teacher</option><option value="admin">Admin — full access</option></select></label>
      </SaveActionForm>
      <div className="space-y-4">{(data || []).map(invitation => <div className="rounded-lg border p-4 space-y-2" key={invitation.id}>
        <p className="font-medium break-all">{invitation.name || invitation.email}</p>
        <p className="text-sm break-all">{invitation.email} · {invitation.role} · {invitation.status === "approved" && new Date(invitation.expires_at) <= new Date() ? "expired" : invitation.status}</p>
        <p className="text-xs text-muted-foreground">Last delivery: {invitation.delivery_status || "not requested"}. Withdrawing a pending invitation does not deactivate an existing staff account.</p>
        {invitation.status === "approved" && <SaveActionForm action={withdrawStaffInvitation} submitLabel="Withdraw pending invitation" successMessage="Pending invitation withdrawn"><input type="hidden" name="id" value={invitation.id}/></SaveActionForm>}
      </div>)}</div>
    </>}
  </section>
}
