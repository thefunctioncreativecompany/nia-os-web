import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";
import { SignUpForm } from "@/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
