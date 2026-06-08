import fs from "node:fs"
import path from "node:path"

const files = {
  "lib/supabase/browser.ts": `import { createBrowserClient } from "@supabase/ssr"

export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
}
`,

  "lib/supabase/server.ts": `import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function supabaseAuthServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Components may not always be able to set cookies.
          }
        },
      },
    }
  )
}

export const supabaseServer = supabaseAuthServer
export const createClient = supabaseAuthServer
`,

  "lib/supabase/service.ts": `import { createClient } from "@supabase/supabase-js"

export function supabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
`,

  "lib/supabase/admin.ts": `import { supabaseService } from "@/lib/supabase/service"

export const supabaseAdmin = supabaseService()
`,

  "lib/auth/require-user.ts": `import { redirect } from "next/navigation"

import { supabaseAuthServer } from "@/lib/supabase/server"

export async function requireUser() {
  const supabase = await supabaseAuthServer()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/sign-in")
  }

  return { user }
}
`,

  "lib/auth/require-admin.ts": `import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth/require-user"
import { supabaseService } from "@/lib/supabase/service"

export async function requireAdmin() {
  const { user } = await requireUser()

  const supabaseAdmin = supabaseService()

  const { data: internalUser, error } = await supabaseAdmin
    .from("users")
    .select("id, auth_user_id, email, name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("Admin lookup failed:", error)
    redirect("/sign-in")
  }

  if (!internalUser || internalUser.role !== "admin") {
    redirect("/unauthorised")
  }

  return {
    user,
    internalUser,
  }
}
`,

  "actions/auth.ts": `"use server"

import { redirect } from "next/navigation"

import { supabaseAuthServer } from "@/lib/supabase/server"

export async function logout() {
  const supabase = await supabaseAuthServer()

  await supabase.auth.signOut()

  redirect("/sign-in")
}
`,

  "app/(auth)/sign-in/page.tsx": `import { SigninForm } from "@/components/auth/SigninForm"

export default function SignInPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SigninForm />
      </div>
    </main>
  )
}
`,

  "app/(auth)/sign-up/page.tsx": `import { SignupForm } from "@/components/auth/SignupForm"

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </main>
  )
}
`,

  "app/(auth)/check-email/page.tsx": `import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We have sent you a confirmation link. Open it to finish creating
            your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button asChild className="w-full">
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
`,

  "app/(auth)/unauthorised/page.tsx": `import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function UnauthorisedPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unauthorised</CardTitle>
          <CardDescription>
            This account does not have access to the admin dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button asChild className="w-full">
            <Link href="/">Back to homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
`,

  "components/auth/SigninForm.tsx": `"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { supabaseBrowser } from "@/lib/supabase/browser"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SigninForm() {
  const supabase = supabaseBrowser()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [magicLoading, setMagicLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handlePasswordSignin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setPasswordLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    setPasswordLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    window.location.href = "/auth/redirect"
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error("Enter your email first")
      return
    }

    setMagicLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: \`\${window.location.origin}/auth/callback\`,
      },
    })

    setMagicLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success("Check your email for your sign-in link")
  }

  async function handleGoogleSignin() {
    setGoogleLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: \`\${window.location.origin}/auth/callback\`,
      },
    })

    if (error) {
      setGoogleLoading(false)
      toast.error(error.message)
    }
  }

  const loading = magicLoading || passwordLoading || googleLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to The Afternoon Academy</CardTitle>
        <CardDescription>
          Access the admin dashboard, leads and timetable trends.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handlePasswordSignin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="space-y-2 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {passwordLoading ? "Signing in..." : "Sign in"}
            </Button>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleMagicLink}
              disabled={loading}
            >
              {magicLoading ? "Sending link..." : "Email me a magic link"}
            </Button>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignin}
              disabled={loading}
            >
              {googleLoading ? "Opening Google..." : "Continue with Google"}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Do not have an account?{" "}
            <Link href="/sign-up" className="font-medium underline">
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
`,

  "components/auth/SignupForm.tsx": `"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { supabaseBrowser } from "@/lib/supabase/browser"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignupForm() {
  const router = useRouter()
  const supabase = supabaseBrowser()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
        emailRedirectTo: \`\${window.location.origin}/auth/callback\`,
      },
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    router.push("/check-email")
  }

  async function handleGoogleSignup() {
    setLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: \`\${window.location.origin}/auth/callback\`,
      },
    })

    if (error) {
      setLoading(false)
      toast.error(error.message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your Afternoon Academy account</CardTitle>
        <CardDescription>
          Parent accounts will later manage bookings, payments and progress
          updates.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Smith"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We will only use this for your account and academy updates.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <div className="space-y-2 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              Continue with Google
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
`,

  "app/(auth)/callback/route.ts": `import { NextResponse } from "next/server"

import { supabaseService } from "@/lib/supabase/service"
import { supabaseAuthServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)

  const supabase = await supabaseAuthServer()
  const code = url.searchParams.get("code")

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Auth exchange failed:", error)
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }

  const email = user.email.toLowerCase()
  const name =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    email.split("@")[0]

  const supabaseAdmin = supabaseService()

  const { data: existingProfile, error: profileFetchError } =
    await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle()

  if (profileFetchError) {
    console.error("Profile fetch failed:", profileFetchError)
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }

  let appRole = existingProfile?.role || "parent"

  if (!existingProfile) {
    const { error: insertProfileError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_user_id: user.id,
        email,
        name,
        role: "parent",
      })

    if (insertProfileError) {
      console.error("Profile insert failed:", insertProfileError)
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }

    appRole = "parent"
  }

  const { data: existingRole, error: roleFetchError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", appRole)
    .maybeSingle()

  if (roleFetchError) {
    console.error("Role fetch failed:", roleFetchError)
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }

  if (!existingRole) {
    const { error: insertRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: appRole,
      })

    if (insertRoleError) {
      console.error("Role insert failed:", insertRoleError)
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }
  }

  const requestedNext = url.searchParams.get("next")
  const fallbackRoute = appRole === "admin" ? "/admin" : "/"

  const safeNext =
    requestedNext &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : fallbackRoute

  return NextResponse.redirect(new URL(safeNext, url.origin))
}
`,

  "app/(auth)/redirect/route.ts": `import { NextResponse } from "next/server"

import { requireUser } from "@/lib/auth/require-user"
import { supabaseService } from "@/lib/supabase/service"

export async function GET(request: Request) {
  const url = new URL(request.url)

  try {
    const { user } = await requireUser()

    const supabaseAdmin = supabaseService()

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, auth_user_id, email, name, role")
      .eq("auth_user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("User lookup failed:", error)
      return NextResponse.redirect(new URL("/sign-in", url.origin))
    }

    let internalUser = data

    if (!internalUser) {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          auth_user_id: user.id,
          email: user.email?.toLowerCase(),
          name: user.user_metadata?.name || user.email?.split("@")[0],
          role: "parent",
        })
        .select("id, auth_user_id, email, name, role")
        .single()

      if (insertError || !newUser) {
        console.error("User creation failed:", insertError)
        return NextResponse.redirect(new URL("/unauthorised", url.origin))
      }

      internalUser = newUser
    }

    if (internalUser.role === "admin") {
      return NextResponse.redirect(new URL("/admin", url.origin))
    }

    return NextResponse.redirect(new URL("/", url.origin))
  } catch (err) {
    console.error("Redirect route error:", err)
    return NextResponse.redirect(new URL("/sign-in", url.origin))
  }
}
`,

  "app/(auth)/login/page.tsx": `import { redirect } from "next/navigation"

export default function LoginRedirectPage() {
  redirect("/sign-in")
}
`,

  "app/admin/layout.tsx": `import Link from "next/link"

import { logout } from "@/actions/auth"
import { requireAdmin } from "@/lib/auth/require-admin"

const navItems = [
  {
    href: "/admin",
    label: "Overview",
  },
  {
    href: "/admin/leads",
    label: "Leads",
  },
  {
    href: "/admin/trends",
    label: "Trends",
  },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { internalUser } = await requireAdmin()

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              The Afternoon Academy
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Admin dashboard
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Signed in as {internalUser.email}
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}

            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">{children}</section>
    </main>
  )
}
`,

  "middleware.ts": `import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
`,
}

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(process.cwd(), filePath)
  const dir = path.dirname(fullPath)

  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(fullPath, content, "utf8")

  console.log(`Created/updated ${filePath}`)
}

console.log("Auth files created successfully.")