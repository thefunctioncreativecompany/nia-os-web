// Supabase's sign-in errors in plain words, with what to do next (Ika, 2026-10-31: email sign-up
// had friction). Unknown messages pass through unchanged.

export type AuthProblem =
  | "unconfirmed"
  | "wrong-password"
  | "already-registered"
  | "link-used"
  | "rate-limited"
  | "weak-password"
  | "other";

export function authProblem(message: string): AuthProblem {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed")) return "unconfirmed";
  if (m.includes("invalid login credentials")) return "wrong-password";
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already exists")) return "already-registered";
  if (m.includes("expired") || m.includes("invalid or has expired") || m.includes("already been used") || m.includes("otp") || m.includes("token")) return "link-used";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return "rate-limited";
  if (m.includes("password should") || m.includes("weak password") || m.includes("at least")) return "weak-password";
  return "other";
}

/** A sentence to show for an auth error message. */
export function friendlyAuthError(message: string): string {
  switch (authProblem(message)) {
    case "unconfirmed":
      return "Confirm your email first: open the link or enter the code we sent. We can send a new one.";
    case "wrong-password":
      return "That email and password don't match. Check them, or reset your password.";
    case "already-registered":
      return "There's already an account with this email. Log in, or reset your password if you've forgotten it.";
    case "link-used":
      return "This link has expired or was already used. Some school and work email opens links to check them, which uses them up. If you've confirmed already, log in; if not, ask for a new link or use the code from the email.";
    case "rate-limited":
      return "Too many tries in a short time. Wait a minute, then try again.";
    case "weak-password":
      // Supabase's own sentence names its rule ("at least 6 characters").
      return message;
    default:
      return message;
  }
}
