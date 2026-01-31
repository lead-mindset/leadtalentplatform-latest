'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Briefcase, CheckCircle2, Info, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function RecruiterLoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/company/dashboard`,
      }
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setOtpSent(true)
    }
  }

  if (otpSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 via-secondary/10 to-accent/5">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>

              <CardTitle className="text-2xl mb-3">Check Your Email</CardTitle>
              <CardDescription className="mb-2">
                We've sent a secure login link to:
              </CardDescription>
              <p className="font-semibold text-foreground mb-6 break-all">{email}</p>
              
              <Alert className="mb-6 text-left border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="ml-2">
                  <p className="font-semibold text-foreground mb-2">Next steps:</p>
                  <ol className="space-y-1 ml-4 list-decimal text-sm">
                    <li>Check your inbox (and spam folder)</li>
                    <li>Click the login link in the email</li>
                    <li>You'll be automatically signed in</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <p className="text-xs text-muted-foreground mb-4">
                The link will expire in 1 hour for security.
              </p>

              <Button
                variant="ghost"
                onClick={() => {
                  setOtpSent(false)
                  setEmail('')
                }}
                className="text-primary hover:text-primary/80"
              >
                ← Use a different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl mb-2">Company Portal</CardTitle>
          <CardDescription>Access your recruiter dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Send Login Link
                </>
              )}
            </Button>

            <Alert className="border-primary/20 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="ml-2">
                <strong className="text-foreground">Passwordless login:</strong>{' '}
                <span className="text-muted-foreground">
                  We'll email you a secure magic link. No password needed!
                </span>
              </AlertDescription>
            </Alert>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Don't have access yet?
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-center border border-border">
              <p className="text-sm text-foreground mb-2">
                Recruiters can only join via invitation.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact your company admin or{' '}
                <a href="mailto:support@yourcompany.com" className="text-primary hover:text-primary/80 font-medium">
                  reach out to support
                </a>
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Are you a student?
            </p>
            <Link 
              href="/auth/login" 
              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
            >
              Go to Student Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}