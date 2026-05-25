"use client";

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DesktopNav from "./DesktopMenu";
import MobileNav from "./MobMenu";
import type { MenuItem } from "./MobMenu";
import { LanguageSwitcher } from '@/components/navigation/language-switcher';
import { getInitials } from '@/lib/utils';

interface NavBarProps {
  user: { name: string; email: string; avatar: string } | null;
  menuItems: MenuItem[];   // pre-translated by NavHeader
  memberId?: string | null;
  signInLabel: string;     // pre-translated by NavHeader
}

export default function NavBar({ user, menuItems, memberId, signInLabel }: NavBarProps) {
  return (
    <nav className="flex items-center h-16 px-6 border-b bg-background relative z-50 font-montserrat">
      <Link href="/" className="flex items-center font-bold gap-2 shrink-0">
        <Image src="/leadl2.svg" alt="LEAD" width={270} height={148} className="h-8 w-auto object-contain" />
        <span className='max-sm:hidden'>LEAD Talent Platform</span>
      </Link>

      <div className="flex gap-4 items-center flex-1 justify-between">
        <div className="flex flex-1 items-center">
          <DesktopNav user={user} items={menuItems} />

          <div className="lg:hidden ml-auto flex items-center gap-2">
            <MobileNav menuItems={menuItems} user={user} memberId={memberId} />
          </div>
        </div>

        <div className="max-sm:hidden">
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
