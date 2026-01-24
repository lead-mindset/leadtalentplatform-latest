import { createClient } from '@/lib/supabase/server'
import { DynamicSidebar } from '@/components/global/navigation/dynamic-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

async function SidebarContent() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userData, error } = await supabase
    .from('User')
    .select(`
      id,
      email,
      name,
      role,
      chapterId,
      Chapter (
        name,
        university
      )
    `)
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    redirect('/auth/login')
  }

  let hasPendingApprovals = false
  if (userData.role === 'editor' && userData.chapterId) {
    const { data: chapterUsers } = await supabase
      .from('User')
      .select('id')
      .eq('chapterId', userData.chapterId)

    if (chapterUsers && chapterUsers.length > 0) {
      const userIds = chapterUsers.map(u => u.id)
      
      const { count } = await supabase
        .from('StudentProfile')
        .select('*', { count: 'exact', head: true })
        .in('userId', userIds)
        .is('approvedById', null)
        .eq('isFilled', true)
        .limit(1)
      
      hasPendingApprovals = (count || 0) > 0
    }
  }

  return (
    <DynamicSidebar 
      user={userData} 
      hasPendingApprovals={hasPendingApprovals}
    />
  )
}

function SidebarFallback() {
  return (
    <div className="w-64 border-r bg-muted/40">
      <div className="p-4">Loading...</div>
    </div>
  )
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Suspense fallback={<SidebarFallback />}>
          <SidebarContent />
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-background p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}