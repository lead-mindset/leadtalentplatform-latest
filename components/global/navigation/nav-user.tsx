"use client";
import Link from "next/link";
import { LogOut, Bell, User } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from 'next-intl';
import { getInitials } from "@/lib/utils";
import type { AuthenticatedNavUser } from '@/lib/types';

interface NavUserProps {
  user: AuthenticatedNavUser
  memberId?: string | null
  onNavigate?: () => void
}

export function NavUser({ user, memberId, onNavigate }: NavUserProps) {
  const t = useTranslations('nav');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
            <AvatarFallback className="border border-border text-xs font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            {memberId ? (
              <span className="text-muted-foreground truncate text-xs font-mono">#{memberId}</span>
            ) : (
              <span className="text-muted-foreground truncate text-xs">{user.email}</span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      
<DropdownMenuContent align="end" className="rounded-xl p-1.5">


  <DropdownMenuItem asChild>
    <Link href="/student/profile" onClick={onNavigate}>
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
        <User className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col cursor-pointer">
        <span className="text-sm">{t('account')}</span>
      </div>
    </Link>
  </DropdownMenuItem>

  <DropdownMenuItem className="rounded-lg cursor-pointer gap-2.5 py-2 text-destructive focus:text-destructive focus:bg-destructive/10">
    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 shrink-0">
      <LogOut className="h-3.5 w-3.5" />
    </div>
    <LogoutButton />
  </DropdownMenuItem>
</DropdownMenuContent>
    </DropdownMenu>
  );
}
