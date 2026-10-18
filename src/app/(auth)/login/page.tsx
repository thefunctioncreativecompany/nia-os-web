import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Log in · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout hero="login">
      <LoginForm />
    </AuthLayout>
  );
}
