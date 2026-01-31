import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { DynamicSidebar } from '@/components/ui/sidebars/dynamic-sidebar'
import { requireUser } from '@/lib/auth'
import type { ReactNode } from 'react'

async function SidebarWithUser() {
  const { user } = await requireUser()
  return <DynamicSidebar user={user} />
}

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarLayout Sidebar={SidebarWithUser}>
      {children}
    </SidebarLayout>
  )
}