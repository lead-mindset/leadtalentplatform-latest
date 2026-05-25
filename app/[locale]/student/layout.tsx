import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { StudentNavigation } from '@/components/ui/sidebars/student-sidebar'
import { MobileUserBadge } from '@/components/ui/sidebars/mobile-user-badge'
import { requireUser, getSidebarStatsForEditor, getChapterDashboardMembership } from '@/lib/auth'
import { getStudentWorkspaceRedirectPath } from '@/lib/auth-redirects'
import { redirect } from 'next/navigation'
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
  const workspaceRedirect = getStudentWorkspaceRedirectPath(user.role)
  if (workspaceRedirect) {
    redirect(workspaceRedirect)
  }

  const { data: membership } = await supabase
    .from('chapter_membership')
    .select('member_id, chapter_id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .maybeSingle()

  const dashboardMembership = await getChapterDashboardMembership(supabase, user.id)
  const canManageChapter = Boolean(dashboardMembership?.chapter_id)

  let has_pending_approvals = false
  if (dashboardMembership?.chapter_id) {
    const stats = await getSidebarStatsForEditor(supabase, dashboardMembership.chapter_id)
    has_pending_approvals = stats.has_pending_approvals
  }

  return (
    <SidebarLayout
      mobileTitle="Mi LEAD"
      mobileSubtitle={membership?.member_id ? 'Panel de miembro' : 'Panel de participante'}
      headerRight={
        <MobileUserBadge
          name={user.name ?? 'Estudiante'}
          memberId={membership?.member_id ?? undefined}
        />
      }
      sidebar={
        <BaseSidebar
          userName={user.name ?? 'Estudiante'}
          userEmail={user.email}
          userRole={user.role}
          memberId={membership?.member_id ?? undefined}
        >
          <StudentNavigation
            userRole={user.role}
            has_pending_approvals={has_pending_approvals}
            canManageChapter={canManageChapter}
          />
        </BaseSidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
