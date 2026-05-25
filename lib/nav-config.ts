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
  HandCoins,
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
    label: 'Explorar eventos',
    href: '/events',
    icon: CalendarSearch,
  },
  {
    id: 'my-events',
    label: 'Mis eventos',
    href: '/student/events',
    icon: QrCode,
  },
  {
    id: 'profile',
    label: 'Perfil',
    href: '/student/profile',
    icon: User,
  },
  {
    id: 'resume',
    label: 'CV',
    href: '/student/resume',
    icon: Sheet,
  },
]

export const CHAPTER_NAV: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Resumen',
    href: '/chapter',
    icon: LayoutDashboard,
  },
  {
    id: 'events',
    label: 'Eventos',
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
    label: 'Miembros',
    href: '/chapter/members',
    icon: UserCheck,
  },
  {
    id: 'funding',
    label: 'Financiamiento',
    href: '/chapter/funding',
    icon: HandCoins,
  },
  {
    id: 'my-profile',
    label: 'Mi perfil',
    href: '/student/profile',
    icon: User,
  },
]

export const ADMIN_NAV: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Resumen',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    id: 'events',
    label: 'Eventos',
    href: '/admin/events',
    icon: CalendarDays,
  },
  {
    id: 'funding',
    label: 'Financiamiento',
    href: '/admin/funding',
    icon: HandCoins,
  },
  {
    id: 'chapters',
    label: 'Capitulos',
    href: '/admin/chapters',
    icon: Building2,
  },
  {
    id: 'users',
    label: 'Usuarios',
    href: '/admin/users',
    icon: Users,
  },
  {
    id: 'companies',
    label: 'Empresas',
    href: '/admin/companies',
    icon: Building,
  },
  {
    id: 'invites',
    label: 'Invitaciones',
    href: '/admin/invites',
    icon: Mail,
  },
  {
    id: 'activity',
    label: 'Actividad',
    href: '/admin/activity',
    icon: Activity,
  },
]

export const COMPANY_NAV: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Resumen',
    href: '/company/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'browse',
    label: 'Explorar talento',
    href: '/company/browse',
    icon: Users,
  },
  {
    id: 'saved',
    label: 'Talento guardado',
    href: '/company/saved',
    icon: Heart,
  },
  {
    id: 'profile',
    label: 'Perfil',
    href: '/company/profile',
    icon: User,
  },
  // Settings removed — page doesn't exist yet
]
