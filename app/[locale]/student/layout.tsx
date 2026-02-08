import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { StudentNavigation } from '@/components/ui/sidebars/student-sidebar'
import { requireUser } from '@/lib/auth'
import type { ReactNode } from 'react'

interface StudentLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function StudentLayout({ 
  children, 
  params 
}: StudentLayoutProps) {
  await params
  
  const { user } = await requireUser()
  
  return (
    <SidebarLayout
      sidebar={
        <BaseSidebar
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
        >
          <StudentNavigation 
            userRole={user.role}
            hasPendingApprovals={false}
          />
        </BaseSidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}