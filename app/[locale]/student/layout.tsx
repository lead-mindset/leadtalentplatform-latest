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
    .from('student_profile')
    .select('member_id, chapter_id')
    .eq('user_id', user.id)
    .single()

  let hasPendingApprovals = false
  if (user.role === 'editor' && profile?.chapter_id) {
    const stats = await getSidebarStatsForEditor(supabase, profile.chapter_id)
    hasPendingApprovals = stats.hasPendingApprovals
  }

  return (
    <SidebarLayout
      headerRight={
        <MobileUserBadge
          name={user.name ?? 'Student'}
          memberId={profile?.member_id ?? undefined}
        />
      }
      sidebar={
        <BaseSidebar
          userName={user.name ?? 'Student'}
          userEmail={user.email}
          userRole={user.role}
          memberId={profile?.member_id ?? undefined}
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