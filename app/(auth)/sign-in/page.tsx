import { SigninForm } from "@/components/auth/SigninForm"

export default function SignInPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SigninForm />
      </div>
    </main>
  )
}
