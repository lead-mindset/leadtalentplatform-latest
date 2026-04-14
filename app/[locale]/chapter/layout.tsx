import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { StudentNavigation } from '@/components/ui/sidebars/student-sidebar'
import { requireChapterEditor, getSidebarStatsForEditor } from '@/lib/auth'
import type { ReactNode } from 'react'

interface ChapterLayoutProps {
  children: ReactNode
}

export default async function ChapterLayout({ children }: ChapterLayoutProps) {
  const { supabase, user, chapterId } = await requireChapterEditor()

  const { data: profile } = await supabase
    .from('StudentProfile')
    .select('memberId')
    .eq('userId', user.id)
    .maybeSingle()

  const { hasPendingApprovals } = await getSidebarStatsForEditor(
    supabase,
    chapterId
  )

  return (
    <SidebarLayout
      sidebar={
        <BaseSidebar
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          memberId={profile.memberId ?? undefined}
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
