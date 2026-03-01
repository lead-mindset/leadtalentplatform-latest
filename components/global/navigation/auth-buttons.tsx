"use client";

import { Button } from "@/components/ui/button";
import { Link } from '@/i18n/routing';
import { NavUser } from "./nav-user";
import { useTranslations } from 'next-intl';

interface AuthButtonsProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  } | null;
  memberId?: string | null;
  className?: string;
  onClick?: () => void;
}

export default function AuthButtons({ user, memberId, className, onClick }: AuthButtonsProps) {
  const t = useTranslations('auth');

  if (user) {
    return <NavUser user={user} memberId={memberId} onNavigate={onClick} />;
  }

  return (
    <div className={`flex flex-col gap-2 w-full ${className || ""}`}>
      <Button asChild size="lg" className="w-full">
        <Link href="/auth/sign-up" onClick={onClick}>{t('signUp')}</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="w-full">
        <Link href="/auth/login" onClick={onClick}>{t('signIn')}</Link>
      </Button>
    </div>
  );
}