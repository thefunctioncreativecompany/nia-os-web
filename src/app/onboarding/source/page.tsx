import { Suspense } from "react";
import type { Metadata } from "next";

import { getOnboardingProfile } from "@/lib/onboarding-data";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";
import { SourceForm } from "@/components/onboarding/source-form";

export const metadata: Metadata = {
  title: "How did you hear about us? · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout hero="source">
      <Suspense fallback={<OnboardingSkeleton />}>
        <Source />
      </Suspense>
    </AuthLayout>
  );
}

async function Source() {
  const profile = await getOnboardingProfile();
  return <SourceForm userId={profile.userId} email={profile.email} initial={profile.heardAbout} />;
}
