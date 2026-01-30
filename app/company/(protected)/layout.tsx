import CompanySidebar from '@/components/ui/sidebars/company-sidebar'
import { SidebarMenuSkeleton, SidebarProvider } from '@/components/ui/sidebar'
import { Suspense } from 'react'
import { SkeletonSidebar } from '@/components/ui/sidebars/skeleton-sidebar'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Suspense fallback={<SkeletonSidebar />}>
          <CompanySidebar />
        </Suspense>

        <main className="flex-1 px-8 py-6">
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </SidebarProvider>
  )
}

function PageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 animate-pulse">
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}