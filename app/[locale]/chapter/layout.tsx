import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { BaseSidebar } from '@/components/ui/sidebars/base-sidebar'
import { StudentNavigation } from '@/components/ui/sidebars/student-sidebar'
import { requireUser, getSidebarStatsForEditor } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

interface ChapterLayoutProps {
  children: ReactNode
}

export default async function ChapterLayout({ children }: ChapterLayoutProps) {
  const { supabase, user } = await requireUser()

  if (user.role !== 'editor') {
    redirect('/student')
  }

  const { data: profile } = await supabase
    .from('StudentProfile')
    .select('chapterId')
    .eq('userId', user.id)
    .maybeSingle()

  if (!profile?.chapterId) {
    redirect('/student')
  }

  const { hasPendingApprovals } = await getSidebarStatsForEditor(
    supabase,
    profile.chapterId
  )
  
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
            hasPendingApprovals={hasPendingApprovals}
          />
        </BaseSidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}