"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";

type Props = {
  email: string;
  name?: string | null;
  role?: Role | null;
  dashboardHref: string;
};

export function UserButton({ email, name, role, dashboardHref }: Props) {
  const router = useRouter();
  const initials = (name ?? email).slice(0, 2).toUpperCase();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label="Menú de usuario"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-2">
          <p className="text-sm font-medium text-foreground truncate">
            {name ?? email}
          </p>
          {name && (
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          )}
          {role && (
            <span className="mt-1.5 inline-block text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {role}
            </span>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={dashboardHref} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Mi cuenta
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}