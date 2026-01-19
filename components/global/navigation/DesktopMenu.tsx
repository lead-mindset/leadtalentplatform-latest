"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import type { MenuItem } from "./NavHeader";
import { ChevronDown } from "lucide-react";

export default function DesktopMenu({
  menuItem,
  isActive,
  onClick,
  onMenuItemClick,
  onSubMenuClick,
}: {
  menuItem: MenuItem;
  isActive: boolean;
  onClick: () => void;
  onMenuItemClick: () => void;
  onSubMenuClick: () => void;
}) {
  const subMenuAnimate = {
    enter: {
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: 0.5,
      },
      display: "block",
    },
    exit: {
      opacity: 0,
      rotateX: -15,
      transition: {
        duration: 0.5,
      },
      transitionEnd: {
        display: "none",
      },
    },
  };

  const hasSubMenu =
    Array.isArray(menuItem?.subMenu) && menuItem.subMenu.length > 0;

  return (
    <motion.li className="group/link" key={menuItem.name}>
      <div className="flex items-center gap-1 px-2 py-1">
        <Link
          href={menuItem.href || "#"}
          target={menuItem.target === "_blank" ? "_blank" : undefined}
          className="py-1 px-2.5 cursor-pointer transition-all 
          flex items-center"
          onClick={onMenuItemClick}
        >
          <h3 className="font-bold text-base">{menuItem.name}</h3>
        </Link>

        {hasSubMenu && (
          <ChevronDown
            onClick={onClick}
            className={`duration-200 hover:bg-opacity-10 rounded-full -ml-2 hover:mt-0.5 hover:bg-gm-white cursor-pointer ${isActive ? "rotate-180" : ""
              }`}
          />
        )}
      </div>

      {hasSubMenu && (
        <motion.div
          className="absolute bg-gm-gray rounded-lg top-10 z-50 p-4 rounded-b-lg origin-[50%_-170px]"
          initial="exit"
          animate={isActive ? "enter" : "exit"}
          variants={subMenuAnimate}
        >
          {(menuItem.subMenu ?? []).map((submenu, i) => (
            <div
              key={`${submenu.name}-${i}`}
              className="hover:text-opacity-100 text-opacity-80 py-1 text-gm-white transition-all"
              onClick={onSubMenuClick}
            >
              <Link
                href={submenu.href || "#"}
                target={menuItem.target === "_blank" ? "_blank" : undefined}
                className="relative cursor-pointer"
                onClick={onMenuItemClick}
              >
                <p>{submenu.name}</p>
              </Link>
            </div>
          ))}
        </motion.div>
      )}
    </motion.li>
  );
}
