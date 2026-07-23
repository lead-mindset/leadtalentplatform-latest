import { Suspense } from 'react';
import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./navbar-client";
import { NavbarSkeleton } from "./navbar-skeleton";
import { getVisibleLinks } from "./nav-links";
import { getChapterDashboardMembership } from "@/lib/auth";
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
  return (
    <Suspense fallback={<NavbarSkeleton />}>
      <NavbarContent />
    </Suspense>
  );
}

async function NavbarContent() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let role: Role | null = null;
  let name: string | null = null;

  if (authUser) {
    const { data: dbUser } = await supabase
      .from("user")
      .select("role, name")
      .eq("id", authUser.id)
      .single();

    role = dbUser?.role ?? null;
    name = dbUser?.name ?? null;
  }

  let hasChapterAccess = false;
  if (authUser && role === 'member') {
    const membership = await getChapterDashboardMembership(supabase, authUser.id);
    hasChapterAccess = Boolean(membership?.chapter_id);
  }

  const visibleLinks = getVisibleLinks(role, hasChapterAccess);
  const dashboardHref = getDashboardHref(role);

  return (
    <NavbarClient
      visibleLinks={visibleLinks}
      user={authUser ? { email: authUser.email ?? "", name, role } : null}
      dashboardHref={dashboardHref}
    />
  );
}