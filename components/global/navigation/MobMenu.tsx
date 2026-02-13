"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
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
}

export default function MobileNav({ menuItems, user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clicked, setClicked] = useState<number | null>(null);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
    setClicked(null);
  };

  const subMenuDrawer = {
    enter: { height: "auto", overflow: "hidden" },
    exit: { height: 0, overflow: "hidden" },
  };

  return (
    <div className="lg:hidden ml-auto">
      <button
        className="z-[999] relative bg-background/90 p-4 rounded-full"
        onClick={toggleDrawer}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <motion.div
        className="fixed left-0 right-0 top-0 bottom-0 h-full bg-background/90 text-foreground font-bold rounded-3xl p-4 overflow-y-auto"
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
      >
        <div className="mb-6">
          <AuthButtons user={user} />
        </div>

        <ul>
          {menuItems.map(({ name, href, target, subMenu }, i) => {
            const isClicked = clicked === i;
            const hasSubMenu = subMenu?.length;
            return (
              <li key={name}>
                <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-md">
                  <Link
                    href={href || "#"}
                    target={target === "_blank" ? "_blank" : undefined}
                    className="flex-1"
                    onClick={toggleDrawer}
                  >
                    {name}
                  </Link>
                </div>


              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}