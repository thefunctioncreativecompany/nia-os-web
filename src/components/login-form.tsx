'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { authProblem, friendlyAuthError } from '@/lib/auth-errors'
import { safeNextPath } from '@/lib/safe-next-path'
import { createClient } from '@/lib/supabase/client'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthInput, AuthPasswordInput } from '@/components/auth/auth-input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        // Not confirmed yet: send a fresh confirmation and show the page with the code box,
        // instead of a dead end (Ika, 2026-10-31).
        if (authProblem(error.message) === 'unconfirmed') {
          await supabase.auth.resend({
            type: 'signup',
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/home` },
          })
          router.push(`/check-email?type=signup&email=${encodeURIComponent(email)}`)
          return
        }
        throw error
      }
      // Send them back where they were going, if a protected page sent them here.
      const next = new URLSearchParams(window.location.search).get('next')
      router.push(safeNextPath(next, '/home'))
    } catch (error: unknown) {
      setError(error instanceof Error ? friendlyAuthError(error.message) : 'Something went wrong. Try again.')
      setIsLoading(false)
    }
  }

  return (
    <AuthForm
      title="Log in"
      description="Welcome back to your workspace"
      submitLabel="Log in"
      pendingLabel="Logging in..."
      isPending={isLoading}
      error={error}
      onSubmit={handleLogin}
      withGoogle
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold text-nia-ink underline">
            Create one
          </Link>
        </>
      }
    >
      <AuthInput
        id="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <AuthPasswordInput
        id="password"
        label="Password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Link
        href="/forgot-password"
        className="-mt-2 self-end text-small leading-normal text-nia-ink-muted hover:underline"
      >
        Forgot password?
      </Link>
    </AuthForm>
  )
}
