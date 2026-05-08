import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { AdminNavigation } from '@/components/ui/sidebars/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { requireAdmin, getSidebarStatsForAdmin } from '@/lib/auth'
import type { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { supabase, user } = await requireAdmin()
  const stats = await getSidebarStatsForAdmin(supabase)
  
  return (
    <SidebarLayout
      mobileTitle="Administracion"
      mobileSubtitle="Platform management"
      headerRight={<Badge variant="outline">Admin</Badge>}
      sidebar={
        <BaseSidebar
          userName={user.name ?? 'Administracion'}
          userEmail={user.email}
          userRole={user.role}
        >
          <AdminNavigation stats={stats} />
        </BaseSidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
