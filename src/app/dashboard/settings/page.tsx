import { Suspense } from "react"

import { getCurrentUser } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { ProfileForm } from "@/components/profile-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="w-full max-w-xl">
          <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
            <Profile />
          </Suspense>
        </div>
      </div>
    </>
  )
}

async function Profile() {
  const user = await getCurrentUser()
  return <ProfileForm user={user} />
}
