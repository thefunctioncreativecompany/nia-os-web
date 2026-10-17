import { Suspense } from "react"

import { getCurrentUser } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import {
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <SidebarProvider>
      <AppSidebar
        user={
          <Suspense fallback={<NavUserSkeleton />}>
            <SidebarUser />
          </Suspense>
        }
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

async function SidebarUser() {
  const user = await getCurrentUser()
  return <NavUser user={user} />
}

function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-2 p-2">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 flex-1" />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
