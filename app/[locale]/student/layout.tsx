import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { StudentNavigation } from '@/components/ui/sidebars/student-sidebar'
import { MobileUserBadge } from '@/components/ui/sidebars/mobile-user-badge'
import { requireUser, getSidebarStatsForEditor } from '@/lib/auth'
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
    .select('memberId, chapterId')
    .eq('userId', user.id)
    .single()

  let hasPendingApprovals = false
  if (user.role === 'editor' && profile?.chapterId) {
    const stats = await getSidebarStatsForEditor(supabase, profile.chapterId)
    hasPendingApprovals = stats.hasPendingApprovals
  }

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
            hasPendingApprovals={hasPendingApprovals}
          />
        </BaseSidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}