"use client";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
  onClick?: () => void;
}

export function LogoutButton({ className, onClick }: LogoutButtonProps) {
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    if (onClick) onClick();
    router.push("/auth/login");
  };

  return (
    <Button onClick={logout} className={className}>
      Logout
    </Button>
  );
}
