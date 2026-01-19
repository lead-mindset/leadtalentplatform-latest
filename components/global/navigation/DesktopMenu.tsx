"use client";

import Link from "next/link";
import { NavLink } from "@/lib/types";
import AuthButtons from "./auth-buttons";

interface DesktopNavProps {
  user: any | null;
  links: NavLink[];
}

export default function DesktopNav({ user, links }: DesktopNavProps) {
  return (
    <>
      <ul className="hidden lg:flex gap-6 ml-10">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
      <div className="ml-auto hidden lg:flex gap-2">
        <AuthButtons user={user} />
      </div>
    </>
  );
}
