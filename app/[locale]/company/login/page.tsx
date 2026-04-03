'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/routing'
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

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/company/dashboard`,
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
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all hover:bg-accent hover:text-accent-foreground gap-2 flex-1"
      >
        <Users className="h-4 w-4" />
        Member Login
      </button>
      <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium bg-background text-foreground shadow-sm gap-2 flex-1">
        <Building2 className="h-4 w-4" />
        Company Login
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
                  <CardTitle className="text-2xl">Check Your Email</CardTitle>
                  <CardDescription className="text-base">
                    We've sent a secure login link to
                  </CardDescription>
                  <p className="font-semibold text-foreground break-all">{email}</p>
                </div>
                <Alert className="text-left">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Next steps:</p>
                    <ol className="space-y-1.5 ml-4 list-decimal text-sm text-muted-foreground">
                      <li>Check your inbox (and spam folder)</li>
                      <li>Click the login link in the email</li>
                      <li>You'll be automatically signed in</li>
                    </ol>
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  The link will expire in 1 hour for security.
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
                  Use a different email
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
            <CardTitle className="text-2xl">Company Portal</CardTitle>
            <CardDescription className="text-base">
              Sign in to access student profiles for your company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
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
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Send Login Link
                  </span>
                )}
              </Button>
            </form>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong className="text-foreground">Passwordless login:</strong>{' '}
                <span className="text-muted-foreground">
                  We'll email you a secure magic link. No password needed!
                </span>
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Don't have access yet?</p>
              <p className="text-sm text-muted-foreground">
                Company representatives can only join via invitation from a LEAD administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}