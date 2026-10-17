import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { safeNextPath } from '@/lib/safe-next-path'
import { createClient } from '@/lib/supabase/server'

// Email links (sign-up confirmation, password reset) land here.
// Supports both link styles:
// - Supabase's default emails send a one-time `code`.
// - Custom email templates send a `token_hash` and `type`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  // Only allow redirects within this site.
  const next = safeNextPath(_next, '/dashboard', origin)

  // Supabase sends people back with an error when a link is expired or used.
  const linkError = searchParams.get('error_description')
  if (linkError) {
    redirect(`/auth/error?error=${encodeURIComponent(linkError)}`)
  }

  if (code || (token_hash && type)) {
    const supabase = await createClient()

    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ type: type!, token_hash: token_hash! })

    if (!error) {
      redirect(next)
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/auth/error?error=${encodeURIComponent('This link is invalid or incomplete.')}`)
}
