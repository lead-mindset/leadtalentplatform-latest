import {
  LayoutDashboard,
  User,
  BookOpen,
  Users,
  Building,
  Building2,
  Mail,
  Activity,
  Heart,
  Settings,
  Sheet
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItemConfig {
  id: string
  label: string
  href: string
  icon: LucideIcon
}

export const STUDENT_NAV: NavItemConfig[] = [
  {
    id: 'profile',
    label: 'Profile',
    href: '/student/profile',
    icon: User,
  },
  {
    id: 'resume',
    label: 'Resume',
    href: '/student/resume',
    icon: Sheet,
  },
]

export const CHAPTER_NAV: NavItemConfig[] = [
  {
    id: 'students',
    label: 'Students',
    href: '/chapter/students',
    icon: BookOpen,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/chapter/settings',
    icon: Settings,
  },
]

export const ADMIN_NAV: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    id: 'chapters',
    label: 'Chapters',
    href: '/admin/chapters',
    icon: Building2,
  },
  {
    id: 'users',
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    id: 'companies',
    label: 'Companies',
    href: '/admin/companies',
    icon: Building,
  },
  {
    id: 'invites',
    label: 'Invites',
    href: '/admin/invites',
    icon: Mail,
  },
  {
    id: 'activity',
    label: 'Activity',
    href: '/admin/activity',
    icon: Activity,
  },
]

export const COMPANY_NAV: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/company/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/company/profile',
    icon: User,
  },
  {
    id: 'browse',
    label: 'Browse Students',
    href: '/company',
    icon: Users,
  },
  {
    id: 'saved',
    label: 'Saved Students',
    href: '/company/saved',
    icon: Heart,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/company/settings',
    icon: Settings,
  },
]