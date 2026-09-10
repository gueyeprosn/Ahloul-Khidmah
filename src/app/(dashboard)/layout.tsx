import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { DashboardShellHeader } from "@/components/layout/dashboard-shell-header"
import { getSession } from "@/lib/auth"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <SidebarProvider>
      <AppSidebar
        user={
          session
            ? { name: session.name, email: session.email }
            : undefined
        }
      />
      <SidebarInset className="overflow-hidden">
        <DashboardShellHeader />
        <div className="flex flex-1 flex-col gap-6 overflow-auto bg-[var(--ak-ivory)] p-4 md:gap-8 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
