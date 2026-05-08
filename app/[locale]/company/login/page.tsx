'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Mail,
  Building2,
  CheckCircle2,
  Info,
  AlertCircle,
  ArrowLeft,
  Users,
} from 'lucide-react'

export default function CompanyLoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const locale = useLocale()
  const isEnglish = locale === 'en'
  const copy = isEnglish
    ? {
        memberLogin: 'Member login',
        companyLogin: 'Company login',
        checkEmail: 'Check your email',
        sentLink: "We've sent a secure login link to",
        nextSteps: 'Next steps:',
        step1: 'Check your inbox and spam folder',
        step2: 'Click the login link in the email',
        step3: "You'll be automatically signed in",
        expires: 'The link expires in 1 hour for security.',
        differentEmail: 'Use a different email',
        title: 'Company Portal',
        description: 'Sign in to access visible LEAD profiles for your company.',
        emailLabel: 'Work email',
        sending: 'Sending...',
        sendLink: 'Send login link',
        passwordlessTitle: 'Passwordless login:',
        passwordlessBody: "We'll email you a secure magic link. No password needed.",
        accessTitle: "Don't have access yet?",
        accessBody:
          'Company representatives can only join via invitation from a LEAD administrator.',
        boundary:
          'English public pages explain LEAD for partners. The MVP company workspace is Spanish-first after login.',
      }
    : {
        memberLogin: 'Ingreso miembro',
        companyLogin: 'Ingreso empresa',
        checkEmail: 'Revisa tu correo',
        sentLink: 'Enviamos un enlace seguro de ingreso a',
        nextSteps: 'Siguientes pasos:',
        step1: 'Revisa tu bandeja y correo no deseado',
        step2: 'Abre el enlace de ingreso del correo',
        step3: 'Ingresaras automaticamente',
        expires: 'El enlace expira en 1 hora por seguridad.',
        differentEmail: 'Usar otro correo',
        title: 'Portal de empresas',
        description: 'Ingresa para acceder a perfiles LEAD visibles para tu empresa.',
        emailLabel: 'Correo corporativo',
        sending: 'Enviando...',
        sendLink: 'Enviar enlace de ingreso',
        passwordlessTitle: 'Ingreso sin contrasena:',
        passwordlessBody: 'Te enviaremos un enlace seguro por correo. No necesitas contrasena.',
        accessTitle: 'Todavia no tienes acceso?',
        accessBody:
          'Los representantes de empresas solo pueden ingresar con invitacion de un administrador LEAD.',
        boundary: '',
      }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/company/dashboard`,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setOtpSent(true)
    }
  }

  const TabBar = () => (
    <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
      <button
        onClick={() => router.push('/auth/login')}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground gap-2 flex-1"
      >
        <Users className="h-4 w-4" />
        {copy.memberLogin}
      </button>
      <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium bg-background text-foreground shadow-sm gap-2 flex-1">
        <Building2 className="h-4 w-4" />
        {copy.companyLogin}
      </div>
    </div>
  )

  if (otpSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <TabBar />
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{copy.checkEmail}</CardTitle>
                  <CardDescription className="text-base">
                    {copy.sentLink}
                  </CardDescription>
                  <p className="font-semibold text-foreground break-all">{email}</p>
                </div>
                <Alert className="text-left">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">{copy.nextSteps}</p>
                    <ol className="space-y-1.5 ml-4 list-decimal text-sm text-muted-foreground">
                      <li>{copy.step1}</li>
                      <li>{copy.step2}</li>
                      <li>{copy.step3}</li>
                    </ol>
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  {copy.expires}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOtpSent(false)
                    setEmail('')
                  }}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {copy.differentEmail}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <TabBar />
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{copy.title}</CardTitle>
            <CardDescription className="text-base">
              {copy.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{copy.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  aria-describedby={error ? 'error-message' : undefined}
                />
              </div>

              {error && (
                <Alert variant="destructive" id="error-message" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                aria-busy={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {copy.sending}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {copy.sendLink}
                  </span>
                )}
              </Button>
            </form>

            <Alert className='border bg-muted'>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong className="text-foreground">{copy.passwordlessTitle}</strong>{' '}
                <span className="text-muted-foreground">
                  {copy.passwordlessBody}
                </span>
              </AlertDescription>
            </Alert>

            <div className="rounded-lg  bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">{copy.accessTitle}</p>
              <p className="text-sm text-muted-foreground">
                {copy.accessBody}
              </p>
            </div>
            {isEnglish ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{copy.boundary}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
