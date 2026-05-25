import type { Role } from "@/lib/types";

export type NavLink = {
  label: string;
  href: string;
  auth?: "public" | "authenticated";
  roles?: Role[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "Events", href: "/events", auth: "public" },
  { label: "Chapters", href: "/chapters", auth: "public" },
  { label: "Partners", href: "/partner-info", auth: "public" },
  { label: "Help", href: "/help", auth: "public" },
  { label: "Dashboard", href: "/student", auth: "authenticated", roles: ["member", "editor"] },
  { label: "Dashboard", href: "/company", auth: "authenticated", roles: ["recruiter"] },
  { label: "Chapter tools", href: "/chapter", auth: "authenticated", roles: ["editor"] },
  { label: "Admin", href: "/admin", auth: "authenticated", roles: ["admin"] },
];

export function getVisibleLinks(role: Role | null): NavLink[] {
  return NAV_LINKS.filter((link) => {
    if (link.auth === "authenticated" && !role) return false;
    if (link.roles && role && !link.roles.includes(role)) return false;
    return true;
  });
}
