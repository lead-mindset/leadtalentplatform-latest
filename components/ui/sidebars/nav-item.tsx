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
  
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
  const adjustedIsActive = exact
    ? pathnameWithoutLocale === item.href
    : item.href === '/' || 
      item.href === '/chapter' || 
      item.href === '/admin' || 
      item.href === '/company' || 
      item.href === '/student'
      ? pathnameWithoutLocale === item.href
      : pathnameWithoutLocale.startsWith(item.href)

  
  
  const handleClick = () => {
    onClick?.()
    
    if (sidebar?.isMobile) {
      sidebar.setOpenMobile(false)
    }
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={adjustedIsActive}>
        <Link 
          href={item.href} 
          className="relative min-w-0"
          onClick={handleClick}
        >
          <Icon className="h-4 w-4" />
          <span className="truncate">{item.label}</span>

          {(badge !== undefined && badge > 0) || showPing ? (
            <span className="ml-auto inline-flex shrink-0 items-center gap-2">
              {badge !== undefined && badge > 0 && (
                <span
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-primary/10 px-1.5 text-[10px] font-semibold tabular-nums text-primary ring-1 ring-primary/20"
                  aria-label={`${badge} items`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}

              {showPing && (
                <span
                  className="inline-flex h-2 w-2 rounded-full bg-destructive"
                  aria-label="Attention required"
                />
              )}
            </span>
          ) : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
