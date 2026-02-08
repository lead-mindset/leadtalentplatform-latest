'use client'

import { Link } from '@/i18n/routing'
import { usePathname } from 'next/navigation'
import { SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import type { LucideIcon } from 'lucide-react'

interface SidebarNavItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: number
  showPing?: boolean
}

export function SidebarNavItem({ 
  href,
  icon: Icon,
  label,
  badge,
  showPing
}: SidebarNavItemProps) {
  const pathname = usePathname()
  const sidebar = useSidebar()
  
  const isActive = href === '/chapter' 
    ? pathname === '/chapter'
    : pathname.startsWith(href)

  const handleClick = () => {
    if (sidebar?.isMobile) {
      sidebar.setOpenMobile(false)
    }
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link 
          href={href} 
          className="relative"
          onClick={handleClick}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          
          {badge !== undefined && badge > 0 && (
            <span 
              className="ml-auto min-w-5 rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium tabular-nums"
              aria-label={`${badge} items`}
            >
              {badge}
            </span>
          )}
          
          {showPing && (
            <span 
              className="absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Attention required"
            >
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}