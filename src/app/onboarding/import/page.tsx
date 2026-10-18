import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";
import { ImportStep } from "@/components/onboarding/import-step";

export const metadata: Metadata = {
  title: "Import your profile · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout hero="import">
      <ImportStep />
    </AuthLayout>
  );
}
