"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { MenuItem } from "./NavHeader";

export default function MobMenu({ menuItems }: { menuItems: MenuItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [clicked, setClicked] = useState<number | null>(null);
  const toggleDrawer = () => {
    setIsOpen(!isOpen);
    setClicked(null);
  };

  const subMenuDrawer = {
    enter: {
      height: "auto",
      overflow: "hidden",
    },
    exit: {
      height: 0,
      overflow: "hidden",
    },
  };

  return (
    <div className="">
      <button className="lg:hidden z-[999] relative bg-background/90 p-4 rounded-full" onClick={toggleDrawer}>
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      <motion.div
        className="fixed left-0 right-0 overflow-y-auto  h-full bg-gm-gray
        bg-background/90 text-foreground font-bold rounded-3xl p-4"
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
      >
        <ul>
          {menuItems.map(({ name, href, target, subMenu }, i) => {
            const isClicked = clicked === i;
            const hasSubMenu = subMenu?.length;
            return (
              <li key={name} className="">
                <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-md relative">
                  <Link
                    href={href || "#"}
                    target={target === "_blank" ? "_blank" : undefined}
                    className="flex-1"
                    onClick={() => {
                      toggleDrawer();
                    }}
                  >
                    {name}
                  </Link>
                  {hasSubMenu && (
                    <ChevronDown
                      className={`ml-2 cursor-pointer transition-transform duration-200 ${isClicked ? "rotate-180" : ""
                        }`}
                      onClick={() => setClicked(isClicked ? null : i)}
                    />
                  )}

                </div>
                {hasSubMenu && (
                  <motion.ul
                    initial="exit"
                    animate={isClicked ? "enter" : "exit"}
                    variants={subMenuDrawer}
                    className="ml-5"
                  >
                    {subMenu.map(({ name, href, target }) => (
                      <Link
                        key={`${name}`}
                        href={href || "#"}
                        target={target === "_blank" ? "_blank" : undefined}
                        className="p-2 flex items-center hover:bg-white/5 rounded-md gap-x-2 cursor-pointer"
                        onClick={() => {
                          toggleDrawer();
                        }}
                      >
                        <p>{name}</p>
                      </Link>
                    ))}
                  </motion.ul>
                )}
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
