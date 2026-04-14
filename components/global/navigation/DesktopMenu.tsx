"use client";

import { Link } from '@/i18n/routing';
import AuthButtons from "./auth-buttons";
import type { MenuItem } from './MobMenu';
import type { AuthenticatedNavUser } from '@/lib/types';

interface DesktopNavProps {
  user: AuthenticatedNavUser | null;
  items: MenuItem[]; 
}

export default function DesktopNav({ user, items }: DesktopNavProps) {
  return (
    <div className='w-full flex items-center'>
      <ul className="hidden lg:flex underline underline-offset-4 gap-6 ml-10 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.name}</Link>
          </li>
        ))}
      </ul>

      <div className="ml-auto hidden lg:flex gap-2">
        <AuthButtons user={user} />
      </div>
    </div>
  );
}
