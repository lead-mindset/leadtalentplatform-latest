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
      <button
        className="relative z-[51] p-2 rounded-full hover:bg-muted transition-colors"
        onClick={toggleDrawer}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <motion.div
        className="fixed inset-0 z-[50] bg-background flex flex-col pt-16 px-6 pb-6 overflow-y-auto"
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        transition={{ type: "tween", duration: 0.25 }}
      >
        <div className="mb-6">
          <AuthButtons
            user={user}
            memberId={memberId}
            onClick={toggleDrawer}
          />
        </div>

        <ul className="flex-1">
          {menuItems.map(({ name, href, target }) => (
            <li key={name}>
              <Link
                href={href || "#"}
                target={target === "_blank" ? "_blank" : undefined}
                className="flex items-center p-4 font-semibold hover:bg-muted rounded-md text-base transition-colors"
                onClick={toggleDrawer}
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-6 border-t space-y-4">

          <p className="text-sm font-normal text-muted-foreground leading-relaxed">
            Learn. Aspire. Discover. Explore
            
          </p>
        </div>

      </motion.div>
    </div>
  );
}