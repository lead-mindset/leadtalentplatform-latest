"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from '@/i18n/routing';
import AuthButtons from "./auth-buttons";

export interface MenuItem {
  name: string;
  href: string;
  target?: string;
  subMenu?: MenuItem[];
}

interface MobileNavProps {
  menuItems: MenuItem[];
  user: any | null;
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