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
  mobileTitle?: string
  mobileSubtitle?: string
}

export function SidebarLayout({
  sidebar,
  children,
  headerRight,
  mobileTitle = 'Resumen',
  mobileSubtitle,
}: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      {sidebar}
      
      <SidebarInset>
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="truncate !text-sm font-semibold text-foreground !leading-tight">{mobileTitle}</p>
              {mobileSubtitle && (
                <p className="truncate !text-xs text-muted-foreground !leading-tight">{mobileSubtitle}</p>
              )}
            </div>
          </div>
          {headerRight && (
            <div className="flex shrink-0 items-center gap-2">
              {headerRight}
            </div>
          )}
        </header>
        
        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
