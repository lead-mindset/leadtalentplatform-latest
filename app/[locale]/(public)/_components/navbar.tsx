import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./navbar-client";
import { getVisibleLinks } from "./nav-links";
import type { Role } from "@/lib/types";

function getDashboardHref(role: Role | null): string {
  switch (role) {
    case "member":
    case "editor":
      return "/student";
    case "recruiter":
      return "/company";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let role: Role | null = null;
  let name: string | null = null;

  if (authUser) {
    const { data: dbUser } = await supabase
      .from("User")
      .select("role, name")
      .eq("id", authUser.id)
      .single();

    role = dbUser?.role ?? null;
    name = dbUser?.name ?? null;
  }

  const visibleLinks = getVisibleLinks(role);
  const dashboardHref = getDashboardHref(role);

  return (
    <NavbarClient
      visibleLinks={visibleLinks}
      user={authUser ? { email: authUser.email ?? "", name, role } : null}
      dashboardHref={dashboardHref}
    />
  );
}