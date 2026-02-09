'use client'

import { SidebarNavItem } from './nav-item'
import {
  SidebarMenu,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { COMPANY_NAV } from '@/lib/nav-config'

export function CompanyNavigation() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {COMPANY_NAV.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              exact={item.id === 'browse'}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}