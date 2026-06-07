import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { AdminNavigation } from '@/components/ui/sidebars/admin-sidebar'
import { Badge } from '@/components/ui/badge'
import { requireAdmin } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = await requireAdmin()
  const t = await getTranslations('adminShell')

  return (
    <SidebarLayout
      mobileTitle={t('mobileTitle')}
      mobileSubtitle={t('mobileSubtitle')}
      headerRight={<Badge variant="outline">Admin</Badge>}
      sidebar={
        <BaseSidebar
          userName={user.name ?? t('mobileTitle')}
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
