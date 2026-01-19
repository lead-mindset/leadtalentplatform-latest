export type Role = "admin" | "editor" | "member";

export type NavLink = {
  label: string;
  href: string;
  auth?: "public" | "authenticated";
  roles?: Role[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "About", href: "/about-us", auth: "public" },
  { label: "Dashboard", href: "/dashboard", auth: "authenticated", roles: ["member", "editor", "admin"] },
  { label: "Manage Content", href: "/content", auth: "authenticated", roles: ["editor", "admin"] },
  { label: "Admin Panel", href: "/admin", auth: "authenticated", roles: ["admin"] },
];
