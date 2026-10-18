import { Suspense } from "react";
import type { Metadata } from "next";

import { getOnboardingProfile } from "@/lib/onboarding-data";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FeaturesStep } from "@/components/onboarding/features-step";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";

export const metadata: Metadata = {
  title: "What you can do on Nia · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout hero="features">
      <Suspense fallback={<OnboardingSkeleton />}>
        <Features />
      </Suspense>
    </AuthLayout>
  );
}

async function Features() {
  const profile = await getOnboardingProfile();
  return <FeaturesStep userId={profile.userId} />;
}
