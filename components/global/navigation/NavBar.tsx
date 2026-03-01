"use client";

import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DesktopNav from "./DesktopMenu";
import MobileNav from "./MobMenu";
import type { MenuItem } from "./MobMenu";
import { LanguageSwitcher } from '@/components/language-switcher';
import { getInitials } from '@/lib/utils';

interface NavBarProps {
  user: { name: string; email: string; avatar: string } | null;
  menuItems: MenuItem[];   // pre-translated by NavHeader
  memberId?: string | null;
  signInLabel: string;     // pre-translated by NavHeader
}

export default function NavBar({ user, menuItems, memberId, signInLabel }: NavBarProps) {
  return (
    <nav className="flex items-center h-16 px-6 border-b bg-background relative z-50">
      <Link href="/" className="flex items-center font-bold gap-2 shrink-0">
        <img src="/leadl2.svg" alt="LEAD" width={32} height={32} />
        LEAD Talent Platform
      </Link>

      <div className="flex gap-4 items-center flex-1 justify-between">
        <div className="flex flex-1 items-center">
          <DesktopNav user={user} items={menuItems} />

          <div className="lg:hidden ml-auto flex items-center gap-2">
            {user ? (
              memberId ? (
                <Badge variant="secondary" className="text-xs font-mono">
                  #{memberId}
                </Badge>
              ) : (
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              )
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/auth/login">{signInLabel}</Link>
              </Button>
            )}
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