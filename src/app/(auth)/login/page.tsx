import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Log in · Nia OS",
};

export default function Page() {
  return (
    <AuthLayout caption="Behind the Scenes, Production Design (2026)">
      <LoginForm />
    </AuthLayout>
  );
}
