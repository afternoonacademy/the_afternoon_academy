"use client"

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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        redirectTo: `${window.location.origin}/auth/callback`,
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
  Admin access is currently invitation-only.
</p>
        </form>
      </CardContent>
    </Card>
  )
}
