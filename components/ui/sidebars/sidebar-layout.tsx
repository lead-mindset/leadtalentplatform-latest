'use client'

import { 
  SidebarProvider, 
  SidebarInset, 
  SidebarTrigger 
} from '@/components/ui/sidebar'
import type { ReactNode } from 'react'

interface SidebarLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

export function SidebarLayout({ sidebar, children }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      {sidebar}
      
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4 md:hidden">
          <SidebarTrigger />
          <h1 className="text-sm font-semibold">Dashboard</h1>
        </header>
        
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}