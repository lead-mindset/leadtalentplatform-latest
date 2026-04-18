"use client";

import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building2, Users, Eye, EyeOff } from "lucide-react";
import { Link, useRouter } from '@/i18n/routing';
import { useState } from "react";
import GoogleButton from "./google-button";
import { useTranslations } from 'next-intl';
import { getAuthErrorKey } from '@/lib/auth-errors'
export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
    } catch (error: unknown) {
      setError(t(getAuthErrorKey(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={cn("w-full max-w-md space-y-6", className)} {...props}>
        {/*  Tab Navigation 
        <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
          <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium bg-background text-foreground shadow-sm gap-2 flex-1">
            <Users className="h-4 w-4" />
            {t('memberLogin')}
          </div>

          <button
            onClick={() => router.push("/company/login")}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground gap-2 flex-1"
          >
            <Building2 className="h-4 w-4" />
            {t('companyLogin')}
          </button>
        </div>*/}

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle asChild>
              <h1 className="text-2xl font-semibold tracking-tight">
                {t('welcomeBack')}
              </h1>
            </CardTitle>
            <CardDescription className="text-base">
              {t('signInToAccount')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <GoogleButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailAddress')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  aria-describedby={error ? "error-message" : undefined}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-primary underline hover:text-primary/80 transition-colors underline-offset-4"
                    tabIndex={-1}
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    aria-describedby={error ? "error-message" : undefined}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" id="error-message" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('signingIn')}
                  </span>
                ) : (
                  t('signIn')
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {t('dontHaveAccount')}{" "}
              <Link
                href="/auth/sign-up"
                className="font-medium text-primary underline hover:text-primary/80 transition-colors underline-offset-4"
              >
                {t('createAccount')}
              </Link>
            </p>
          </CardContent>
        </Card>

        {/*  <p className="text-center text-xs text-muted-foreground leading-relaxed">
          {t('byContinuing')}{" "}
          <Link
            href="/terms"
            className="text-primary underline hover:text-foreground/80 transition-colors underline-offset-4"
          >
            {t('termsOfService')}
          </Link>{" "}
          {t('and')}{" "}
          <Link
            href="/privacy"
            className="text-primary underline hover:text-foreground/80 transition-colors underline-offset-4"
          >
            {t('privacyPolicy')}
          </Link>
        </p>*/}
      </div>
    </div>
  );
}