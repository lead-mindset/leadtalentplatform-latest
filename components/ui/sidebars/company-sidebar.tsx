'use server'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Users,
  Heart,
  Settings,
  Building,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function CompanySidebar() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/auth/login')

  const { data: user } = await supabase
    .from('User')
    .select('id, role, email, name, Company(name)')
    .eq('id', authUser.id)
    .maybeSingle()

  if (!user || user.role !== 'recruiter') {
    redirect('/auth/login')
  }

  const { data: recruiterAccess } = await supabase
    .from('RecruiterAccess')
    .select('id')
    .eq('acceptedByUserId', user.id)
    .eq('isActive', true)
    .maybeSingle()

  if (!recruiterAccess) {
    redirect('/auth/login')
  }

  const companyName = Array.isArray(user.Company)
    ? user.Company[0]?.name
    : user.Company?.name

  const navItems = [
    {
      title: 'Dashboard',
      href: '/company/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Browse Students',
      href: '/company',
      icon: Users,
    },
    {
      title: 'Saved Students',
      href: '/company/saved',
      icon: Heart,
    },
    {
      title: 'Settings',
      href: '/company/settings',
      icon: Settings,
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {companyName || 'Company'}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
