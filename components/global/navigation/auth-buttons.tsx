"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

interface AuthButtonsProps {
  user: any | null;
  className?: string;
  onClick?: () => void;
}

export default function AuthButtons({ user, className, onClick }: AuthButtonsProps) {
  if (user) {
    return <LogoutButton onClick={onClick} className={className} />;
  }

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login" onClick={onClick}>Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/auth/sign-up" onClick={onClick}>Sign up</Link>
      </Button>
    </div>
  );
}
