export type Role = "admin" | "editor" | "member";

export type NavLink = {
  label: string;
  href: string;
  auth?: "public" | "authenticated";
  roles?: Role[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "About", href: "/about-us", auth: "public" },
  { label: "Dashboard", href: "/student", auth: "authenticated", roles: ["member", "editor"] },
  { label: "Manage Chapter", href: "/chapter", auth: "authenticated", roles: ["editor"] },
  { label: "Admin Panel", href: "/admin", auth: "authenticated", roles: ["admin"] },
];
