import { createClient } from "@/lib/supabase/server";
import { NAV_LINKS } from "../../../lib/types";
import NavBar from "./NavBar";
import type { Role } from "../../../lib/types";

export default async function NavHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: Role | null = null;

  if (user) {
    const { data: dbUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    role = dbUser?.role ?? null;
  }

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.auth === "authenticated" && !user) return false;
    if (link.roles && (!role || !link.roles.includes(role))) return false;
    return true;
  });

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background border-b">
      <NavBar user={user} links={visibleLinks} />
    </header>
  );
}
