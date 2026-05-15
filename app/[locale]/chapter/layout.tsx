import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { StudentNavigation } from '@/components/ui/sidebars/student-sidebar'
import { requireChapterMember, getSidebarStatsForEditor } from '@/lib/auth'
import type { ReactNode } from 'react'

interface ChapterLayoutProps {
  children: ReactNode
}

export default async function ChapterLayout({ children }: ChapterLayoutProps) {
  const { supabase, user, chapter_id } = await requireChapterMember()

  const { data: profile } = await supabase
    .from('chapter_membership')
    .select('member_id')
    .eq('user_id', user.id)
    .eq('chapter_id', chapter_id)
    .eq('status', 'approved')
    .maybeSingle()

  const { has_pending_approvals } = await getSidebarStatsForEditor(
    supabase,
    chapter_id
  )

  return (
    <SidebarLayout
      mobileTitle="Chapter"
      mobileSubtitle="Herramientas de miembros y eventos"
      sidebar={
        <BaseSidebar
          userName={user.name ?? ''}
          userEmail={user.email}
          userRole={user.role}
          memberId={profile?.member_id ?? undefined}
        >
          <StudentNavigation
            userRole={user.role}
            has_pending_approvals={has_pending_approvals}
          />
        </BaseSidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
