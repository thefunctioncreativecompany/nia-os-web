import Link from "next/link";

export function BackToLoginLink() {
  return (
    <Link href="/login" className="leading-normal hover:underline">
      Back to login
    </Link>
  );
}
