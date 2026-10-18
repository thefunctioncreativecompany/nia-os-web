import { AuthLayout } from "@/components/auth/auth-layout";

// One shared shell, so the hero slideshow keeps playing as the steps change.
export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return <AuthLayout>{children}</AuthLayout>;
}
