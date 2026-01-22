'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, FileText, Bell, Settings, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'

const navigation = [
  { name: 'Profile', href: '/student/profile', icon: User },
  { name: 'Resume', href: '/student/resume', icon: FileText },
  { name: 'Notifications', href: '/student/notifications', icon: Bell },
  { name: 'Settings', href: '/student/settings', icon: Settings },
]

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="px-2 py-4">
              <h2 className="text-xl font-bold tracking-tight">LEAD</h2>
              <p className="text-sm text-sidebar-foreground/70">Student Portal</p>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/api/auth/signout">
                    <LogOut />
                    <span>Sign Out</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto bg-background p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}