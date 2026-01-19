"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NavUser } from "./nav-user";

interface AuthButtonsProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  } | null;
  className?: string;
}

export default function AuthButtons({ user, className }: AuthButtonsProps) {
  if (user) {
    return <NavUser user={user} />;
  }

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
