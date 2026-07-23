import type { Role } from "@/lib/types";

export type NavLink = {
  label: string;
  href: string;
  auth?: "public" | "authenticated";
  roles?: Role[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/student", auth: "authenticated", roles: ["member", "editor"] },
  { label: "Dashboard", href: "/company", auth: "authenticated", roles: ["recruiter"] },
  { label: "Dashboard", href: "/admin", auth: "authenticated", roles: ["admin"] },
  { label: "Chapter tools", href: "/chapter", auth: "authenticated", roles: ["editor"] },
  { label: "Events", href: "/events", auth: "public" },
  { label: "Chapters", href: "/chapters", auth: "public" },
];

export function getVisibleLinks(role: Role | null, hasChapterAccess?: boolean): NavLink[] {
  return NAV_LINKS.filter((link) => {
    if (link.auth === "authenticated" && !role) return false;

    const roleMatches = !link.roles || (role && link.roles.includes(role));

    if (link.label === "Chapter tools") {
      if (role === "editor") return true;
      if (role === "member" && hasChapterAccess) return true;
      return false;
    }

    if (link.roles && role && !link.roles.includes(role)) return false;
    return true;
  });
}
