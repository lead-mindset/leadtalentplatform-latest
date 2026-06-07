import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { AdminNavigation } from '@/components/ui/sidebars/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { requireAdmin } from '@/lib/auth'
import type { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = await requireAdmin()
  
  return (
    <SidebarLayout
      mobileTitle="Administración"
      mobileSubtitle="Platform management"
      headerRight={<Badge variant="outline">Admin</Badge>}
      sidebar={
        <BaseSidebar
          userName={user.name ?? 'Administración'}
          userEmail={user.email}
          userRole={user.role}
        >
          <AdminNavigation />
        </BaseSidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
