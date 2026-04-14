"use client";

import { useState } from "react";
import AuthButtons from "./auth-buttons";
import type { AuthenticatedNavUser } from '@/lib/types';

export interface MenuItem {
  name: string;
  href: string;
  target?: string;
  subMenu?: MenuItem[];
}

interface MobileNavProps {
  menuItems: MenuItem[];
  user: AuthenticatedNavUser | null;
  memberId?: string | null;
}

export default function MobileNav({ menuItems, user, memberId }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleDrawer = () => setIsOpen(prev => !prev);

  return (
    <div className="lg:hidden relative z-50">
          <AuthButtons
            user={user}
            memberId={memberId}
            onClick={toggleDrawer}
          />
    </div>
  );
}
