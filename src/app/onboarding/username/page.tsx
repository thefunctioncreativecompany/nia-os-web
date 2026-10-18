import { Suspense } from "react";
import type { Metadata } from "next";

import { getOnboardingProfile } from "@/lib/onboarding-data";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";
import { UsernameForm } from "@/components/onboarding/username-form";

export const metadata: Metadata = {
  title: "Choose your username · Nia OS",
};

export default function Page() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <Username />
    </Suspense>
  );
}

async function Username() {
  const profile = await getOnboardingProfile();
  return (
    <UsernameForm
      userId={profile.userId}
      fullName={profile.fullName}
      email={profile.email}
      initial={profile.username}
    />
  );
}
