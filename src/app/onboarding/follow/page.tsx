import { Suspense } from "react";
import type { Metadata } from "next";

import { getOnboardingProfile } from "@/lib/onboarding-data";
import { FollowForm } from "@/components/onboarding/follow-form";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";

export const metadata: Metadata = {
  title: "Follow creators & studios · Nia OS",
};

export default function Page() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <Follow />
    </Suspense>
  );
}

async function Follow() {
  const profile = await getOnboardingProfile();
  return <FollowForm userId={profile.userId} initial={profile.followedCreators} />;
}
