
'use client'

import { useState, ReactNode, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"

interface MobileSidebarContextType {
  closeSheet: () => void
}

const MobileSidebarContext = createContext<MobileSidebarContextType | null>(null)

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext)
  return context
}

interface MobileSidebarWrapperProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function MobileSidebarWrapper({
  children,
  title = 'Resumen',
  subtitle,
}: MobileSidebarWrapperProps) {
  const [open, setOpen] = useState(false)

  const closeSheet = () => setOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex min-h-14 items-center gap-3 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon-sm"
              aria-label="Navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Access your profile, resume, and chapter management options
            </SheetDescription>
            <MobileSidebarContext.Provider value={{ closeSheet }}>
              {children}
            </MobileSidebarContext.Provider>
          </SheetContent>
        </Sheet>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  )
}
