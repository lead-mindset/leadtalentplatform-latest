import { SidebarLayout } from '@/components/ui/sidebars/sidebar-layout'
import CompanySidebar from '@/components/ui/sidebars/company-sidebar'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarLayout Sidebar={CompanySidebar}>
      {children}
    </SidebarLayout>
  )
}