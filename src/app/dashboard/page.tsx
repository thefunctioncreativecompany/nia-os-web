import { Suspense } from "react"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <Suspense fallback={<DashboardSkeleton />}>
          <Overview />
        </Suspense>
      </div>
    </>
  )
}

async function Overview() {
  const user = await getCurrentUser()

  return (
    <>
      <h2 className="text-2xl font-semibold">
        Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}
      </h2>
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardDescription>Productions</CardDescription>
            <CardTitle>Coming next</CardTitle>
          </CardHeader>
        </Card>
        <Link href="/dashboard/settings">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardDescription>Your profile</CardDescription>
              <CardTitle>
                {user.name && user.avatarUrl ? "Complete" : "Add your name and photo"}
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-48" />
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </>
  )
}
