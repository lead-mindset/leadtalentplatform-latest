import { createClient } from '@/lib/supabase/server'

import { AdminSidebar } from '@/components/global/navigation/admin-sidebar'

import { SidebarProvider } from '@/components/ui/sidebar'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

async function SidebarContent() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get user data
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

  // Ensure user is an admin
  if (userData.role !== 'admin') {
    redirect('/student')
  }

  // Get pending invites count
  const { count: pendingInvitesCount } = await supabase
    .from('RecruiterAccess')
    .select('*', { count: 'exact', head: true })
    .is('acceptedAt', null)
    .is('revokedAt', null)
    .gt('inviteExpiresAt', new Date().toISOString())

  // Get total pending approvals across all chapters
  const { count: pendingApprovalsCount } = await supabase
    .from('StudentProfile')
    .select('*', { count: 'exact', head: true })
    .is('approvedById', null)
    .eq('isFilled', true)

  // Get system stats
  const [
    { count: totalUsers },
    { count: totalChapters },
    { count: totalCompanies }
  ] = await Promise.all([
    supabase.from('User').select('*', { count: 'exact', head: true }),
    supabase.from('Chapter').select('*', { count: 'exact', head: true }),
    supabase.from('Company').select('*', { count: 'exact', head: true })
  ])

  return (
    <AdminSidebar 
      user={userData}
      stats={{
        pendingInvites: pendingInvitesCount || 0,
        pendingApprovals: pendingApprovalsCount || 0,
        totalUsers: totalUsers || 0,
        totalChapters: totalChapters || 0,
        totalCompanies: totalCompanies || 0
      }}
    />
  )
}

function SidebarFallback() {
  return (
    <div className="w-64 border-r bg-muted/40 animate-pulse">
      <div className="p-4 space-y-4">
        <div className="h-8 bg-muted-foreground/20 rounded" />
        <div className="h-6 bg-muted-foreground/20 rounded w-3/4" />
        <div className="space-y-2 pt-4">
          <div className="h-10 bg-muted-foreground/20 rounded" />
          <div className="h-10 bg-muted-foreground/20 rounded" />
          <div className="h-10 bg-muted-foreground/20 rounded" />
          <div className="h-10 bg-muted-foreground/20 rounded" />
          <div className="h-10 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({
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