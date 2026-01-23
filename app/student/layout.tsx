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
import { LogoutButton } from '@/components/logout-button'

const navigation = [
  { name: 'Profile', href: '/student/profile', icon: User },
  { name: 'Resume', href: '/student/resume', icon: FileText },
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
         <SidebarHeader className="mt-4">
            <Link href="/" className="flex items-center font-bold gap-2 px-2 mb-4">
              <img src="/leadl2.svg" alt="LEAD" width={32} height={32} />
              LEAD 
            </Link>
            <div className="px-2 space-y-1">
              <p className="text-xs text-muted-foreground">Welcome back,</p>
              <p className="font-semibold text-lg">John Doe</p>
              <p className="text-xs text-muted-foreground">john.doe@university.edu</p>
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
                  <LogoutButton/>
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