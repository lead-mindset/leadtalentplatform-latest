'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, FileText, Bell, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          <div className="p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                LEAD
              </h2>
              <p className="text-sm text-muted-foreground">Student Portal</p>
            </div>
          </div>

          <Separator />

          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <Separator />

          <div className="p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
              asChild
            >
              <a href="/api/auth/signout">
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </a>
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}