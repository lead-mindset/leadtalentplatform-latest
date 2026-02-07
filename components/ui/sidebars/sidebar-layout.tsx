import { SidebarProvider } from "../sidebar"
import { ReactNode } from "react"
import { MobileSidebarWrapper } from "./mobile-header"

interface SidebarLayoutProps {
  sidebar: ReactNode
  mobileSidebar: ReactNode
  children: ReactNode
}

export function SidebarLayout({ 
  sidebar,
  mobileSidebar,
  children,
}: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <aside className="hidden md:flex">
          {sidebar}
        </aside>

        <div className="flex-1 flex flex-col w-full">
          <MobileSidebarWrapper>
            {mobileSidebar}
          </MobileSidebarWrapper>

          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}