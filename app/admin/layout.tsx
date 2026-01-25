import { SidebarProvider } from '@/components/ui/sidebar'
import { Suspense } from 'react'
import { SkeletonSidebar } from '@/components/ui/sidebars/skeleton-sidebar'
import { AdminSidebar } from '@/components/ui/sidebars/admin-sidebar'
import { requireUser, getSidebarStatsForAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function SidebarContent() {
  const { supabase, user } = await requireUser()

  if (user.role !== 'admin') redirect('/student')

  const stats = await getSidebarStatsForAdmin(supabase)

  return <AdminSidebar user={user} stats={stats} />
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Suspense fallback={<SkeletonSidebar />}>
          <SidebarContent />
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-background p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
