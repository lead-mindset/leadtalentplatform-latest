import { requireRecruiter } from '@/lib/company-actions';
import { Building, LayoutDashboard, Heart, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function CompanySidebar() {
  const { user } = await requireRecruiter();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/company/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Browse Students',
      href: '/company',
      icon: Users,
    },
    {
      name: 'Saved Students',
      href: '/company/saved',
      icon: Heart,
    },
    {
      name: 'Settings',
      href: '/company/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 border-r bg-muted/10 p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Building className="h-5 w-5" />
          <h2 className="font-semibold">{user.Company?.name}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRecruiter();

  return (
    <div className="flex min-h-screen">
      <CompanySidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
