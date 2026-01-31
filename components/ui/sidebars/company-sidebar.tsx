'use server'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Users,
  Heart,
  Settings,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BaseSidebar from './base-sidebar'

export default async function CompanySidebar() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/auth/login')

  const { data: user } = await supabase
    .from('User')
    .select('id, role, email, name')
    .eq('id', authUser.id)
    .single()

  if (!user || user.role !== 'recruiter') {
    redirect('/auth/login')
  }

  const { data: recruiterAccess } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      isActive,
      Company (
        name,
        id
      )
    `)
    .eq('acceptedByUserId', user.id)
    .eq('isActive', true)
    .is('revokedAt', null)
    .maybeSingle()

  if (!recruiterAccess) {
    redirect('/company/onboard')
  }

  const company = Array.isArray(recruiterAccess.Company)
    ? recruiterAccess.Company[0]
    : recruiterAccess.Company

  const companyName = company?.name || 'Company'

  const navItems = [
    {
      title: 'Dashboard',
      href: '/company/dashboard',
      icon: LayoutDashboard,
    },
    { title: 'Profile', href: '/company/profile', icon: User },
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
    <BaseSidebar
      userName={companyName}
      userEmail={user.email}
      userRole="Recruiter"
    >
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
    </BaseSidebar>
  )
}