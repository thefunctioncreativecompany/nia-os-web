import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout caption="On Set, Cinematography Department (2026)" crop="recovery">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
