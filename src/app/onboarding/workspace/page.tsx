import { Suspense } from "react";
import type { Metadata } from "next";

import { getOnboardingWorkspace } from "@/lib/onboarding-data";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-primitives";
import { WorkspaceForm } from "@/components/onboarding/workspace-form";

export const metadata: Metadata = {
  title: "Set up your workspace · Nia OS",
};

export default function Page() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <Workspace />
    </Suspense>
  );
}

async function Workspace() {
  const workspace = await getOnboardingWorkspace();
  return <WorkspaceForm initial={workspace} />;
}
