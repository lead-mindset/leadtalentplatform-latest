import {
  LayoutDashboard,
  User,
  UserCheck,
  Users,
  Building,
  Building2,
  Mail,
  Activity,
  Heart,
  Sheet,
  CalendarDays,
  ScanLine,
  CalendarSearch,
  QrCode,
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
    id: 'browse-events',
    label: 'Browse Events',
    href: '/events',
    icon: CalendarSearch,
  },
  {
    id: 'my-events',
    label: 'My Events',
    href: '/student/events',
    icon: QrCode,
  },
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
    id: 'overview',
    label: 'Overview',
    href: '/chapter',
    icon: LayoutDashboard,
  },
  {
    id: 'events',
    label: 'Events',
    href: '/chapter/events',
    icon: CalendarDays,
  },
  {
    id: 'checkin',
    label: 'Check-in',
    href: '/chapter/checkin',
    icon: ScanLine,
  },
  {
    id: 'members',
    label: 'Members',
    href: '/chapter/members',
    icon: UserCheck,
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
    id: 'events',
    label: 'Events',
    href: '/admin/events',
    icon: CalendarDays,
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
    id: 'browse',
    label: 'Browse Students',
    href: '/company/browse',
    icon: Users,
  },
  {
    id: 'saved',
    label: 'Saved Students',
    href: '/company/saved',
    icon: Heart,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/company/profile',
    icon: User,
  },
  // Settings removed — page doesn't exist yet
]
 