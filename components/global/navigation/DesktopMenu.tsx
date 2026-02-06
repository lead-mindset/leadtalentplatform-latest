"use client";

import { Link } from '@/i18n/routing';
import AuthButtons from "./auth-buttons";
import type { MenuItem } from './MobMenu';

interface DesktopNavProps {
  user: any | null;
  items: MenuItem[]; 
}

export default function DesktopNav({ user, items }: DesktopNavProps) {
  return (
    <>
      <ul className="hidden lg:flex gap-6 ml-10">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.name}</Link>
          </li>
        ))}
      </ul>

      <div className="ml-auto hidden lg:flex gap-2">
        <AuthButtons user={user} />
      </div>
    </>
  );
}
