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
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Link, useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useState } from "react";
import { GoogleButton } from "./google-button";
import { useLocale, useTranslations } from 'next-intl';
import { getAuthErrorKey } from '@/lib/auth-errors'
import { resolvePostLoginRedirect } from '@/lib/actions/auth/resolve-post-login-redirect'
import { getAuthEmailValidationMessage, isValidAuthEmail } from '@/lib/auth-form-validation'

const POST_LOGIN_REDIRECT_RETRY_DELAYS_MS = [0, 250, 750]

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  if (value.startsWith('/auth/')) return null
  return value
}

async function resolvePostLoginRedirectWithRetry() {
  let lastResult: Awaited<ReturnType<typeof resolvePostLoginRedirect>> | null = null

  for (const delayMs of POST_LOGIN_REDIRECT_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    const result = await resolvePostLoginRedirect()
    if (result.success) return result
    lastResult = result
  }

  return lastResult ?? {
    success: false as const,
    error: 'We could not load your account destination. Please try signing in again.',
  }
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('auth');
  const locale = useLocale();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isValidAuthEmail(email)) {
      setError(getAuthEmailValidationMessage(locale === 'en' ? 'en' : 'es'));
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (!data.user?.id) {
        setError(t('anErrorOccurred'));
        return;
      }

      const nextPath = getSafeNextPath(searchParams.get('next'))
      if (nextPath) {
        router.push(nextPath)
        return
      }

      const redirectResult = await resolvePostLoginRedirectWithRetry()
      if (!redirectResult.success) {
        setError(redirectResult.error);
        return;
      }

      router.push(redirectResult.path);
    } catch (error: unknown) {
      setError(t(getAuthErrorKey(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={cn("w-full max-w-md space-y-6", className)} {...props}>
        {}

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

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
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
                  title={getAuthEmailValidationMessage(locale === 'en' ? 'en' : 'es')}
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
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
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

        <p className="text-center text-xs text-muted-foreground">
          {t('contactSupport')}
          <a
            href="mailto:abriones@leadmindset.org"
            className="text-primary underline hover:text-primary/80 transition-colors underline-offset-4"
          >
            abriones@leadmindset.org
          </a>
        </p>
      </div>
    </div>
  );
}
