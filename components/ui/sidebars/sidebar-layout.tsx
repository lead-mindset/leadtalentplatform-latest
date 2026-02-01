import { SidebarProvider } from "../sidebar"
import { Suspense } from "react"
import { SkeletonSidebar } from "./skeleton-sidebar"
import { SidebarLayoutProps } from "@/lib/types"

export function SidebarLayout({ 
  Sidebar, 
  children,
  sidebarFallback = <SkeletonSidebar />,
  contentFallback = <div>Loading...</div>
}: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Suspense fallback={sidebarFallback}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-background p-8">
          <Suspense fallback={contentFallback}>
            {children}
          </Suspense>
        </main>
      </div>
    </SidebarProvider>
  )
}