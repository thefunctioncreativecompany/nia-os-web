import { Suspense } from "react";
import type { Metadata } from "next";

import { getOnboardingProfile } from "@/lib/onboarding-data";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";
import { PhotoForm } from "@/components/onboarding/photo-form";

export const metadata: Metadata = {
  title: "Add a profile photo · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout hero="photo">
      <Suspense fallback={<OnboardingSkeleton />}>
        <Photo />
      </Suspense>
    </AuthLayout>
  );
}

async function Photo() {
  const profile = await getOnboardingProfile();
  return (
    <PhotoForm
      userId={profile.userId}
      fullName={profile.fullName}
      email={profile.email}
      avatarUrl={profile.avatarUrl}
    />
  );
}
