"use client";
import { useState } from "react";
import DesktopMenu from "./DesktopMenu";
import type { MenuItem } from "./NavHeader";
import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/ui/social-links";

function NavBar({ menuItems }: { menuItems: MenuItem[] }) {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  const handleMenuClick = (menuName: string) => {
    setSelectedMenu((prev) => (prev === menuName ? null : menuName));
  };

  const handleSubMenuClick = () => {
    setSelectedMenu(null);
  };

  const handleMenuItemClick = () => {
    setSelectedMenu(null);
  };

  return (

    <div className="flex w-full text-background">
      <div className="">
        <Link
          href={"/"}
          className="cursor-pointer bg-white rounded-br-2xl gap-2 p-2 flex px-4"
        >
          <Image
            src="/leadl2.svg"
            alt="Next.js Logo"
            width={35}
            height={35}
          />
          <h3 className="font-bold text-lg">LEAD</h3>

        </Link>
      </div>
      <div className="flex-1 h-2 "></div>


      <SocialLinks
        className="hidden lg:flex px-3"
      />


      <ul className="flex bg-white rounded-bl-2xl items-center">
        {menuItems.map((menuItem) => (
          <DesktopMenu
            menuItem={menuItem}
            key={menuItem.name}
            isActive={selectedMenu === menuItem.name}
            onClick={() => handleMenuClick(menuItem.name)}
            onMenuItemClick={handleMenuItemClick}
            onSubMenuClick={handleSubMenuClick}
          />
        ))}


        <Link
          href={'/get-involved'}
          className=" rounded-bl-2xl h-full bg-linear-to-br from-primary to-chart-1 transition-all 
          flex items-center"
        >
          <button
            className="cursor-pointer px-4 text-base text-white font-bold"
          >
            Get Involved
          </button>
        </Link>




      </ul>


    </div>
  );
}

export default NavBar;
