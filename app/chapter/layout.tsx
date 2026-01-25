import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { DynamicSidebar } from '@/components/ui/sidebars/dynamic-sidebar'
import { redirect } from 'next/navigation'
import { requireUser, getSidebarStatsForEditor } from '@/lib/auth'
import { Suspense } from 'react'
import { SkeletonSidebar } from '@/components/ui/sidebars/skeleton-sidebar'

async function SidebarContent() {
  const { supabase, user } = await requireUser()

  if (user.role !== 'editor') redirect('/student')

  const { hasPendingApprovals } = await getSidebarStatsForEditor(
    supabase,
    user.chapterId
  )

  return <DynamicSidebar user={user} hasPendingApprovals={hasPendingApprovals} />
}

export default function ChapterLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout 
      Sidebar={() => (
        <Suspense fallback={<SkeletonSidebar />}>
          <SidebarContent />
        </Suspense>
      )}
    >
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </SidebarLayout>
  )
}