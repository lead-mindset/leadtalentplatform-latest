// app/[locale]/student/layout.tsx
import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import { DynamicSidebar } from '@/components/ui/sidebars/dynamic-sidebar'
import { requireUser } from '@/lib/auth'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function StudentLayout({ children, params }: Props) {
  await params
  const { user } = await requireUser()
  
  return (
    <SidebarLayout 
      sidebar={<DynamicSidebar user={user} />}
      mobileSidebar={<DynamicSidebar user={user} isMobile />}
    >
      {children}
    </SidebarLayout>
  )
}