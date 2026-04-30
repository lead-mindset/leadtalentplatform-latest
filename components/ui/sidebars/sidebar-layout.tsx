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
  headerRight?: ReactNode
}

export function SidebarLayout({ sidebar, children, headerRight }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      {sidebar}
      
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 md:hidden">
          <SidebarTrigger />
          {headerRight && (
            <div className="flex items-center gap-2">
              {headerRight}
            </div>
          )}
        </header>
        
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}