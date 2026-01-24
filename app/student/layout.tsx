import { createClient } from '@/lib/supabase/server'
import { DynamicSidebar } from '@/components/global/navigation/dynamic-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { redirect } from 'next/navigation'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get user data with chapter info
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

  // Check for pending approvals ONLY if user is an editor
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
        .limit(1)  // Just check if any exist
      
      hasPendingApprovals = (count || 0) > 0
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DynamicSidebar 
          user={userData} 
          hasPendingApprovals={hasPendingApprovals}
        />
        <main className="flex-1 overflow-y-auto bg-background p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}