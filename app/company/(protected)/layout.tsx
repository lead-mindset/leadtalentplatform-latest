// app/company/(protected)/layout.tsx
import { createClient } from '@/lib/supabase/server';
import { Building, LayoutDashboard, Heart, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function getRecruiterAccess() {
  const supabase = await createClient();
  
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/auth/login?redirect=/company');
  }

  const { data: user } = await supabase
    .from('User')
    .select(
      `
      id, email, name, role,
      RecruiterAccess!RecruiterAccess_acceptedByUserId_fkey (
        id, isActive, acceptedAt, revokedAt, companyId,
        Company (id, name)
      )
    `
    )
    .eq('id', authUser.id)
    .single();

  if (!user) {
    redirect('/auth/login');
  }

  // If not a recruiter, redirect to appropriate dashboard
  if (user.role !== 'recruiter') {
    redirect('/dashboard');
  }

  // Find active access
  const activeAccess = Array.isArray(user.RecruiterAccess)
    ? user.RecruiterAccess.find((a: any) => 
        a.isActive && !a.revokedAt && a.acceptedAt
      )
    : null;

  // If no active access, redirect to onboarding
  if (!activeAccess) {
    redirect('/company/onboard');
  }

  return {
    user: {
      ...user,
      Company: activeAccess.Company,
    },
    companyId: activeAccess.companyId,
  };
}

async function CompanySidebar() {
  const { user } = await getRecruiterAccess();

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

  const companyName = Array.isArray(user.Company)
    ? user.Company[0]?.name
    : user.Company?.name;

  return (
    <div className="w-64 border-r bg-muted/10 p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Building className="h-5 w-5" />
          <h2 className="font-semibold">{companyName || 'Company'}</h2>
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
  await getRecruiterAccess();

  return (
    <div className="flex min-h-screen">
      <CompanySidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}