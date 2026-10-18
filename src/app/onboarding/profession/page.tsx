import { Suspense } from "react";
import type { Metadata } from "next";

import { getOnboardingProfile } from "@/lib/onboarding-data";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";
import { ProfessionForm } from "@/components/onboarding/profession-form";

export const metadata: Metadata = {
  title: "Your profession · Nia OS",
};

export default function Page() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <Profession />
    </Suspense>
  );
}

async function Profession() {
  const profile = await getOnboardingProfile();
  return <ProfessionForm userId={profile.userId} initial={profile.profession} />;
}
