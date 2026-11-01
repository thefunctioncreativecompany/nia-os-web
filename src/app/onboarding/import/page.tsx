import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { features } from "@/lib/features";
import { hiddenStepRedirect } from "@/lib/onboarding";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ImportStep } from "@/components/onboarding/import-step";

export const metadata: Metadata = {
  title: "Import your profile · Nia OS",
};

export default function Page() {
  // Hidden for now (features.onboardingExtrasShown): straight on to the next step.
  if (!features.onboardingExtrasShown) redirect(hiddenStepRedirect("import"));
  return (
    <AuthLayout hero="import">
      <ImportStep />
    </AuthLayout>
  );
}
