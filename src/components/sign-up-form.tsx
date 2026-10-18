'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthInput, AuthPasswordInput } from '@/components/auth/auth-input'

export function SignUpForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Shown in the sidebar and profile settings.
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/home`,
        },
      })
      if (error) throw error
      // No session means Supabase wants the email confirmed first.
      router.push(
        data.session
          ? '/home'
          : `/check-email?type=signup&email=${encodeURIComponent(email)}`
      )
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <AuthForm
      title="Create account"
      description="Join the production workspace"
      submitLabel="Create account"
      pendingLabel="Creating account..."
      isPending={isLoading}
      error={error}
      onSubmit={handleSignUp}
      withGoogle
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-nia-ink underline">
            Log in
          </Link>
        </>
      }
    >
      <AuthInput
        id="name"
        label="Full name"
        autoComplete="name"
        required
        maxLength={80}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
        label="Create a password"
        autoComplete="new-password"
        minLength={8}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </AuthForm>
  )
}
