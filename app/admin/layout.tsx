import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { AdminSidebar } from '@/components/ui/sidebars/admin-sidebar'
import { Suspense } from 'react'
import { SkeletonSidebar } from '@/components/ui/sidebars/skeleton-sidebar'
import { getSidebarStatsForAdmin, requireAdmin } from '@/lib/auth'

async function SidebarContent() {
  const { supabase, user } = await requireAdmin()
  const stats = await getSidebarStatsForAdmin(supabase)
  return <AdminSidebar user={user} stats={stats} />
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout Sidebar={SidebarContent}>
      {children}
    </SidebarLayout>
  )
}