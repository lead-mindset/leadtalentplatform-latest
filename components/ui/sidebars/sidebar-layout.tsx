import { SidebarProvider } from "../sidebar"

type SidebarLayoutProps = {
  Sidebar: React.ComponentType
  children: React.ReactNode
}

export function SidebarLayout({ Sidebar, children }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}