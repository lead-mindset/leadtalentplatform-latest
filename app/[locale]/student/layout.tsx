import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { StudentNavigation } from '@/components/ui/sidebars/student-sidebar'
import { MobileUserBadge } from '@/components/ui/sidebars/mobile-user-badge'
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
  
  const { supabase, user } = await requireUser()

  const { data: profile } = await supabase
    .from('StudentProfile')
    .select('memberId')
    .eq('userId', user.id)
    .single()
  
  return (
    <SidebarLayout
      headerRight={
        <MobileUserBadge
          name={user.name}
          memberId={profile?.memberId ?? undefined}
        />
      }
      sidebar={
        <BaseSidebar
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          memberId={profile?.memberId ?? undefined}
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