import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { DynamicSidebar } from '@/components/ui/sidebars/dynamic-sidebar'
import { redirect } from 'next/navigation'
import { requireUser, getSidebarStatsForEditor } from '@/lib/auth'

async function SidebarContent() {
  const { supabase, user } = await requireUser()

  if (user.role !== 'editor') redirect('/student')

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

  return <DynamicSidebar user={user} hasPendingApprovals={hasPendingApprovals} />
}

export default function ChapterLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout Sidebar={SidebarContent}>
      {children}
    </SidebarLayout>
  )
}