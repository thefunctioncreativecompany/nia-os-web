import { Suspense } from "react";
import type { Metadata } from "next";

import { getOnboardingProfile } from "@/lib/onboarding-data";
import { FeaturesStep } from "@/components/onboarding/features-step";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";

export const metadata: Metadata = {
  title: "What you can do on Nia · Nia OS",
};

export default function Page() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <Features />
    </Suspense>
  );
}

async function Features() {
  const profile = await getOnboardingProfile();
  return <FeaturesStep userId={profile.userId} />;
}
