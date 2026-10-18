import Link from "next/link";

// Black pill used for the primary action on every auth screen.
export const authButtonClassName =
  "h-11 w-full rounded-full bg-nia-ink px-6 text-sm leading-[1.4] font-bold text-white hover:bg-nia-ink/85";

export function BackToLoginLink() {
  return (
    <Link href="/login" className="leading-normal hover:underline">
      Back to login
    </Link>
  );
}
