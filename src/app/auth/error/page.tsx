import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/auth-layout'
import { authButtonClassName } from '@/components/auth/auth-primitives'

export const metadata: Metadata = {
  title: 'Something went wrong · Nia OS',
}

// Where /auth/confirm sends people when an email or Google sign-in link fails.
export default function Page({ searchParams }: PageProps<'/auth/error'>) {
  return (
    <AuthLayout hero="auth-error">
      <div className="flex w-full max-w-[380px] flex-col gap-7">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 font-bold text-nia-ink">
            Something went wrong
          </h1>
          <p className="text-sm leading-normal break-words text-nia-ink-muted">
            <Suspense fallback="The link didn't work.">
              <ErrorMessage searchParams={searchParams} />
            </Suspense>
          </p>
        </div>
        <Button asChild className={authButtonClassName}>
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    </AuthLayout>
  )
}

async function ErrorMessage({ searchParams }: Pick<PageProps<'/auth/error'>, 'searchParams'>) {
  const { error } = await searchParams
  return typeof error === 'string' && error ? error : "The link didn't work."
}
