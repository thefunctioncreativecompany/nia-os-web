import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";
import { UpdatePasswordForm } from "@/components/update-password-form";

export const metadata: Metadata = {
  title: "Create new password · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout>
      <UpdatePasswordForm />
    </AuthLayout>
  );
}
