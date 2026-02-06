import {Link} from '@/i18n/routing'
import { SidebarMenuItem, SidebarMenuButton } from '../sidebar'

interface NavItemProps {
  name: string
  href: string
  icon: React.ComponentType<any>
  isActive: boolean
  badgeCount?: number
  showPing?: boolean
}

export function NavItem({ name, href, icon: Icon, isActive, badgeCount, showPing }: NavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={href} className="relative flex items-center gap-2">
          <Icon />
          <span>{name}</span>

          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="ml-auto px-1 rounded bg-secondary text-xs">{badgeCount}</span>
          )}

          {showPing && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
