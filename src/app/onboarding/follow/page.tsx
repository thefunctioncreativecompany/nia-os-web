import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getOnboardingProfile } from "@/lib/onboarding-data";
import { features } from "@/lib/features";
import { hiddenStepRedirect } from "@/lib/onboarding";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FollowForm } from "@/components/onboarding/follow-form";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";

export const metadata: Metadata = {
  title: "Follow creators & studios · Nia OS",
};

export default function Page() {
  // Hidden for now (features.onboardingExtrasShown): straight on to the next step.
  if (!features.onboardingExtrasShown) redirect(hiddenStepRedirect("follow"));
  return (
    <AuthLayout hero="follow">
      <Suspense fallback={<OnboardingSkeleton />}>
        <Follow />
      </Suspense>
    </AuthLayout>
  );
}

async function Follow() {
  const profile = await getOnboardingProfile();
  return <FollowForm userId={profile.userId} initial={profile.followedCreators} />;
}
