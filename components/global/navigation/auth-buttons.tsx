"use client";

import { Button } from "@/components/ui/button";
import {Link} from '@/i18n/routing';
import { NavUser } from "./nav-user";
import {useTranslations} from 'next-intl';

interface AuthButtonsProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  } | null;
  className?: string;
}

export default function AuthButtons({ user, className }: AuthButtonsProps) {
  const t = useTranslations('auth');
  
  if (user) {
    return <NavUser user={user} />;
  }

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">{t('signIn')}</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/auth/sign-up">{t('signUp')}</Link>
      </Button>
    </div>
  );
}
