import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";

import { getInboxUrl } from "@/lib/email-inbox";
import { Button } from "@/components/ui/button";
import { authButtonClassName, BackToLoginLink } from "@/components/auth/auth-primitives";
import { AuthLayout } from "@/components/auth/auth-layout";
import {
  ResendEmailButton,
  type EmailLinkType,
} from "@/components/auth/resend-email-button";

export const metadata: Metadata = {
  title: "Check your email · Nia OS",
};

// Reached after sign-up (?type=signup) or a password reset request (?type=recovery),
// with the address in ?email=.
export default function Page({ searchParams }: PageProps<"/check-email">) {
  return (
    <AuthLayout caption="Director's Monitor, Pre-Production (2026)" crop="recovery">
      <Suspense fallback={<CheckEmail email={null} type="recovery" />}>
        <CheckEmailFromParams searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}

async function CheckEmailFromParams({
  searchParams,
}: Pick<PageProps<"/check-email">, "searchParams">) {
  const params = await searchParams;
  const email = typeof params.email === "string" && params.email ? params.email : null;
  const type: EmailLinkType = params.type === "signup" ? "signup" : "recovery";
  return <CheckEmail email={email} type={type} />;
}

function CheckEmail({ email, type }: { email: string | null; type: EmailLinkType }) {
  const sentTo = email ? (
    <span className="font-bold text-nia-ink">{email}</span>
  ) : (
    "your email"
  );

  return (
    <div className="flex w-full max-w-[380px] flex-col items-center gap-7 text-center">
      <div className="flex h-15 w-16 items-center justify-center rounded-full bg-nia-line">
        <Image src="/auth/mail.svg" alt="" width={28} height={28} />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-[32px] leading-[1.3] font-bold text-nia-ink">
          Check your email
        </h1>
        <p className="text-sm leading-normal break-words text-nia-ink-muted">
          {type === "signup" ? (
            <>
              We&apos;ve sent a confirmation link to {sentTo}. Open it to
              activate your account.
            </>
          ) : (
            <>
              We&apos;ve sent a password reset link to {sentTo}. Check your inbox
              and follow the instructions.
            </>
          )}
        </p>
      </div>

      {/* Finding the inbox can take a DNS lookup, so show a plain mail link meanwhile. */}
      <Suspense fallback={<OpenEmailButton href={null} />}>
        <OpenInbox email={email} />
      </Suspense>

      <div className="flex w-full flex-col items-center gap-4 text-[13px] text-nia-ink-muted">
        <p>
          Didn&apos;t receive it? <ResendEmailButton email={email} type={type} />
        </p>
        <BackToLoginLink />
      </div>
    </div>
  );
}

async function OpenInbox({ email }: { email: string | null }) {
  const href = email ? await getInboxUrl(email) : null;
  return <OpenEmailButton href={href} />;
}

// Opens the user's web inbox (Gmail, Outlook, ...) in a new tab when the
// provider is known, otherwise falls back to the device's mail app.
function OpenEmailButton({ href }: { href: string | null }) {
  return (
    <Button asChild className={authButtonClassName}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          Open email app
        </a>
      ) : (
        <a href="mailto:">Open email app</a>
      )}
    </Button>
  );
}
