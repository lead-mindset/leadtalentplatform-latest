'use client'

import { Link } from '@/i18n/routing'
import { usePathname } from 'next/navigation'
import { SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import type { NavItemConfig } from '@/lib/nav-config'

interface SidebarNavItemProps {
  item: NavItemConfig
  badge?: number
  showPing?: boolean
  exact?: boolean
  onClick?: () => void
}

export function SidebarNavItem({ 
  item,
  badge,
  showPing,
  exact = false,
  onClick,
}: SidebarNavItemProps) {
  const pathname = usePathname()
  const sidebar = useSidebar()
  
  const Icon = item.icon
  
  const isActive = exact
    ? pathname === item.href
    : item.href === '/' || 
      item.href === '/chapter' || 
      item.href === '/admin' || 
      item.href === '/company' || 
      item.href === '/student'
      ? pathname === item.href
      : pathname.startsWith(item.href)

  const handleClick = () => {
    onClick?.()
    
    if (sidebar?.isMobile) {
      sidebar.setOpenMobile(false)
    }
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link 
          href={item.href} 
          className="relative"
          onClick={handleClick}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
          
          {badge !== undefined && badge > 0 && (
            <span 
              className="ml-auto min-w-5 rounded-full bg-sidebar-accent px-1.5 py-0.5 text-xs font-medium tabular-nums text-sidebar-accent-foreground"
              aria-label={`${badge} items`}
            >
              {badge > 99 ? '99+' : badge}
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