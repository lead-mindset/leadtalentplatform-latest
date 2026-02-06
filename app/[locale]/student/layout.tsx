import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { DynamicSidebar } from '@/components/ui/sidebars/dynamic-sidebar'
import { requireUser } from '@/lib/auth'
import type { ReactNode } from 'react'

async function SidebarWithUser() {
  const { user } = await requireUser()
  return <DynamicSidebar user={user} />
}

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function StudentLayout({ children, params }: Props) {
  await params
  
  return (
    <SidebarLayout Sidebar={SidebarWithUser}>
      {children}
    </SidebarLayout>
  )
}