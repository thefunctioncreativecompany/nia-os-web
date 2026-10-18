'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthInput } from '@/components/auth/auth-input'
import { BackToLoginLink } from '@/components/auth/auth-primitives'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      })
      if (error) throw error
      router.push(`/check-email?type=recovery&email=${encodeURIComponent(email)}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <AuthForm
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      submitLabel="Send reset link"
      pendingLabel="Sending..."
      isPending={isLoading}
      error={error}
      onSubmit={handleForgotPassword}
      footer={<BackToLoginLink />}
    >
      <AuthInput
        id="email"
        type="email"
        label="Email address"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </AuthForm>
  )
}
