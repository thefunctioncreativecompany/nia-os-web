"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authButtonClassName } from "@/components/auth/auth-primitives";
import { GoogleButton } from "@/components/auth/google-button";

// Shared body for the auth forms: heading, fields, error, primary action,
// optional "or" divider + Google button, and the links underneath.
// The Supabase form components (login-form.tsx etc.) own the state and submit logic.
export function AuthForm({
  title,
  description,
  submitLabel,
  pendingLabel,
  isPending = false,
  error,
  onSubmit,
  withGoogle = false,
  footer,
  children,
}: {
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  isPending?: boolean;
  error?: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  withGoogle?: boolean;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full max-w-[380px] flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 font-bold text-nia-ink">
          {title}
        </h1>
        <p className="text-sm leading-normal text-nia-ink-muted">
          {description}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-7">
        <div className="flex flex-col gap-4">
          {children}
          {error && (
            <p role="alert" className="text-small leading-normal text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button type="submit" disabled={isPending} className={authButtonClassName}>
            {isPending ? pendingLabel : submitLabel}
          </Button>

          {withGoogle && (
            <>
              <div className="flex items-center gap-3">
                <Separator className="flex-1 bg-nia-line" />
                <span className="text-small leading-normal text-nia-ink-muted">
                  or
                </span>
                <Separator className="flex-1 bg-nia-line" />
              </div>
              <GoogleButton />
            </>
          )}
        </div>
      </form>

      <div className="text-small text-nia-ink-muted">{footer}</div>
    </div>
  );
}
