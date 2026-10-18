'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthPasswordInput } from '@/components/auth/auth-input'
import { BackToLoginLink } from '@/components/auth/auth-primitives'

// Used on /reset-password, after the reset link in the email has signed the user in.
export function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <AuthForm
      title="Create new password"
      description="Your new password must be at least 8 characters."
      submitLabel="Reset password"
      pendingLabel="Saving..."
      isPending={isLoading}
      error={error}
      onSubmit={handleUpdatePassword}
      footer={<BackToLoginLink />}
    >
      <AuthPasswordInput
        id="password"
        label="New password"
        autoComplete="new-password"
        minLength={8}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <AuthPasswordInput
        id="confirm-password"
        label="Confirm password"
        autoComplete="new-password"
        minLength={8}
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
    </AuthForm>
  )
}
