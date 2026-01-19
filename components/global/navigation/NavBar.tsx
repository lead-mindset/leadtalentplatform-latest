"use client";

import Link from "next/link";
import DesktopNav from "./DesktopMenu";
import MobileNav from "./MobMenu";
import type { NavLink } from "@/lib/types";
import type { MenuItem } from "./MobMenu";

interface NavBarProps {
  user: any | null;
  links: NavLink[];
}

export default function NavBar({ user, links }: NavBarProps) {
  const menuItems: MenuItem[] = links.map((l) => ({ name: l.label, href: l.href }));

  return (
    <nav className="flex items-center h-16 px-6 border-b bg-background relative z-50">
      <Link href="/" className="flex items-center font-bold gap-2">
        <img src="/leadl2.svg" alt="LEAD" width={32} height={32} />
        LEAD Talent Platform
      </Link>

      <DesktopNav user={user} links={links} />
      <MobileNav menuItems={menuItems} user={user} />
    </nav>
  );
}
