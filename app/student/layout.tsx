'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, FileText, Bell, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="border-b p-6">
            <h2 className="text-lg font-semibold">LEAD Student Portal</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/api/auth/signout">
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </a>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}