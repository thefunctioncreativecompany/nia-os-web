import { Suspense } from "react"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"

// Placeholder home until the Figma home screen is built.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 px-4 pt-12 pb-15 md:px-15">
      <Suspense fallback={<Skeleton className="h-9 w-64" />}>
        <Welcome />
      </Suspense>
      <Link
        href="/settings/profile"
        className="flex max-w-md flex-col gap-1 rounded-[12px] border border-nia-line p-6 transition-colors hover:bg-nia-field-muted"
      >
        <span className="text-base leading-normal font-bold text-nia-ink">Your profile</span>
        <span className="text-[13px] leading-normal text-nia-ink-muted">
          Add your photo, role and how Nia should work with you.
        </span>
      </Link>
    </div>
  )
}

async function Welcome() {
  const user = await getCurrentUser()

  return (
    <h1 className="text-[28px] leading-[1.3] font-bold text-nia-ink">
      Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}
    </h1>
  )
}
