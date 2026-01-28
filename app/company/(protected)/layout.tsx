import CompanySidebar from '@/components/ui/sidebars/company-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <CompanySidebar />

        <main className="flex-1 px-8 py-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
