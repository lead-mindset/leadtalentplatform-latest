import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { StudentNavigation } from '@/components/ui/sidebars/student-sidebar'
import { requireChapterMember, getSidebarStatsForEditor } from '@/lib/auth'
import type { ReactNode } from 'react'

interface ChapterLayoutProps {
  children: ReactNode
}

export default async function ChapterLayout({ children }: ChapterLayoutProps) {
  const { supabase, user, chapterId } = await requireChapterMember()

  const { data: profile } = await supabase
    .from('student_profile')
    .select('member_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { hasPendingApprovals } = await getSidebarStatsForEditor(
    supabase,
    chapterId
  )

  return (
    <SidebarLayout
      sidebar={
        <BaseSidebar
          userName={user.name ?? ''}
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
