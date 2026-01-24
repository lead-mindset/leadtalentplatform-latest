import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { DynamicSidebar } from '@/components/ui/sidebars/dynamic-sidebar'
import { requireUser } from '@/lib/auth'
import { Suspense } from 'react'

import type { ReactNode } from 'react'
import { SkeletonSidebar } from '@/components/ui/sidebars/skeleton-sidebar'

async function SidebarWithUser() {
  const { user } = await requireUser()
  return <DynamicSidebar user={user} />
}

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarLayout 
      Sidebar={() => (
        <Suspense fallback={<SkeletonSidebar/>}>
          <SidebarWithUser />
        </Suspense>
      )}
    >
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </SidebarLayout>
  )
}