import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import CompanySidebar from '@/components/ui/sidebars/company-sidebar'
import { Suspense } from 'react'
import { SkeletonSidebar } from '@/components/ui/sidebars/skeleton-sidebar'

function PageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 animate-pulse">
      <div className="mb-8">
        <div className="h-10 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-muted rounded w-1/4"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-48 bg-muted rounded"></div>
        <div className="h-48 bg-muted rounded"></div>
        <div className="h-48 bg-muted rounded"></div>
      </div>
    </div>
  )
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarLayout Sidebar={CompanySidebar}>
      {children}
    </SidebarLayout>
  )
}