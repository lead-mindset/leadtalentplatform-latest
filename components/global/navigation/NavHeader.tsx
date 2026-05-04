import { createClient } from "@/lib/supabase/server";
import { NAV_LINKS } from "../../../lib/types";
import NavBar from "./NavBar";
import type { Role } from "../../../lib/types";
import { getTranslations } from "next-intl/server";

export default async function NavHeader() {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  let role: Role | null = null;
  let memberId: string | null = null;

  if (authUser) {
    const { data: dbUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", authUser.id)
      .single();

    role = dbUser?.role ?? null;

    if (role === 'member' || role === 'editor') {
      const { data: membership } = await supabase
        .from("chapter_membership")
        .select("member_id")
        .eq("user_id", authUser.id)
        .eq("status", "approved")
        .maybeSingle();

      memberId = membership?.member_id ?? null;
    }
  }

  const tNav  = await getTranslations('nav');
  const tAuth = await getTranslations('auth');

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.auth === "authenticated" && !authUser) return false;
    if (link.roles && (!role || !link.roles.includes(role))) return false;
    return true;
  });

  const menuItems = visibleLinks.map((l) => ({
    name: tNav(l.label),
    href: l.href,
  }));

  const user = authUser ? {
    name: authUser.user_metadata?.full_name
       ?? authUser.user_metadata?.name
       ?? authUser.email
       ?? 'User',
    email: authUser.email ?? '',
    avatar: authUser.user_metadata?.avatar_url ?? '',
  } : null;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background border-b">
      <NavBar
        user={user}
        menuItems={menuItems}
        memberId={memberId}
        signInLabel={tAuth('signIn')}
      />
    </header>
  );
}
