"use client";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/ui/icons';

interface LogoutButtonProps {
  className?: string;
  onClick?: () => void;
  label?: string;
}

export function LogoutButton({ className, onClick, label }: LogoutButtonProps) {
  const router = useRouter();
  const t = useTranslations('common');

  const logout = async () => {
    await supabase.auth.signOut();
    if (onClick) onClick();
    router.push("/auth/login");
  };

  return (
    <Button onClick={logout} variant="outline" className={className}>
      <Icons.LogOut className="mr-2 h-4 w-4" />
      {label ?? t('logout')}
    </Button>
  );
}
