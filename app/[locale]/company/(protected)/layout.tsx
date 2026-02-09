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
  
  const companyName = user.Company?.name || 'Company'
  
  return (
    <SidebarLayout
      sidebar={
        <BaseSidebar
          userName={companyName}
          userEmail={user.email}
          userRole="Company"
        >
          <CompanyNavigation />
        </BaseSidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}