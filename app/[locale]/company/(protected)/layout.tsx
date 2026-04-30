import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { CompanyNavigation } from '@/components/ui/sidebars/company-sidebar'
import { requireRecruiter } from '@/lib/auth'
import type { ReactNode } from 'react'

interface CompanyLayoutProps {
  children: ReactNode
}

export default async function CompanyLayout({ children }: CompanyLayoutProps) {
  const { user } = await requireRecruiter()

  return (
    <SidebarLayout
      sidebar={
        <BaseSidebar
          userName={user.name ?? 'Recruiter'}
          userEmail={user.email}
          userRole="recruiter"
        >
          <CompanyNavigation />
        </BaseSidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}