import { Suspense } from "react";
import type { Metadata } from "next";

import { getOnboardingWorkspace } from "@/lib/onboarding-data";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";
import { WorkspaceForm } from "@/components/onboarding/workspace-form";

export const metadata: Metadata = {
  title: "Set up your workspace · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout hero="workspace">
      <Suspense fallback={<OnboardingSkeleton />}>
        <Workspace />
      </Suspense>
    </AuthLayout>
  );
}

async function Workspace() {
  const workspace = await getOnboardingWorkspace();
  return <WorkspaceForm initial={workspace} />;
}
