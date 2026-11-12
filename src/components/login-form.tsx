'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'

import { authProblem, friendlyAuthError } from '@/lib/auth-errors'
import { safeNextPath } from '@/lib/safe-next-path'
import { createClient } from '@/lib/supabase/client'
import { parseAccounts, remember, switchTo } from '@/lib/accounts'
import { AccountChoices } from '@/components/auth/account-choices'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthInput, AuthPasswordInput } from '@/components/auth/auth-input'

const noChange = () => () => {}
const accountsSnapshot = () => {
  try {
    return localStorage.getItem('nia-accounts') ?? '[]'
  } catch {
    return '[]'
  }
}

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
      const { data, error } = await supabase.auth.signInWithPassword({
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
      // Saved on this device, so the user can switch back to it later (src/lib/accounts.ts).
      remember(data.session)
      // Send them back where they were going, if a protected page sent them here.
      const next = new URLSearchParams(window.location.search).get('next')
      router.push(safeNextPath(next, '/home'))
    } catch (error: unknown) {
      setError(error instanceof Error ? friendlyAuthError(error.message) : 'Something went wrong. Try again.')
      setIsLoading(false)
    }
  }

  // Accounts already used on this device (Ika, 2026-11-11): one tap to continue as one of them.
  // "Add another account" (?add=1) keeps the current one signed in and shows this form for the next.
  const raw = useSyncExternalStore(noChange, accountsSnapshot, () => '[]')
  const accounts = useMemo(() => parseAccounts(raw), [raw])
  const adding = useSyncExternalStore(noChange, () => new URLSearchParams(window.location.search).has('add'), () => false)
  const continueAs = async (id: string) => {
    setIsLoading(true)
    if ((await switchTo(createClient(), id)) === 'ok') { router.push('/home'); router.refresh(); return }
    setIsLoading(false)
    setError('That account was signed out. Log in to it again below.')
  }

  return (
    <AuthForm
      title={adding ? 'Add an account' : 'Log in'}
      description={adding ? 'You stay signed in to your other accounts' : 'Welcome back to your workspace'}
      submitLabel="Log in"
      pendingLabel="Logging in..."
      isPending={isLoading}
      error={error}
      onSubmit={handleLogin}
      withGoogle
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href={adding ? '/signup?add=1' : '/signup'} className="font-bold text-nia-ink underline">
            Create one
          </Link>
        </>
      }
    >
      {!adding && accounts.length > 0 && <AccountChoices accounts={accounts} disabled={isLoading} onPick={continueAs} />}
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
