'use client'

import { useState } from 'react'
import { acceptInvite } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Building2, Mail, Loader2, CheckCircle2 } from 'lucide-react'

interface OnboardContentProps {
  inviteToken: string
  companyName: string
  companyLogo?: string | null
  recruiterEmail: string
}

export default function OnboardContent({
  inviteToken,
  companyName,
  companyLogo,
  recruiterEmail,
}: OnboardContentProps) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password && password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const result = await acceptInvite({
        inviteToken,
        password: password || undefined,
        name: name || undefined,
      })

      if (!result.success) {
        setError(result.error || 'Failed to accept invite')
        setLoading(false)
        return
      }

      // Check if we need email verification (OTP flow)
      if (result.requiresEmailVerification) {
        setEmailSent(true)
        setLoading(false)
        return
      }

      // Password flow - redirect will happen automatically via server action
      // Keep loading state while redirect happens
    } catch (err) {
      console.error('Accept invite error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent to-muted p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="space-y-4">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-12 w-auto mx-auto"
              />
            ) : (
              <Building2 className="h-12 w-12 mx-auto text-primary" />
            )}
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-16 w-16 mx-auto text-chart-2" />
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a login link to <strong>{recruiterEmail}</strong>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Click the link in your email to complete your onboarding and access the dashboard.
              </AlertDescription>
            </Alert>

            <p className="text-xs text-muted-foreground text-center">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent to-muted p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-4">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="h-12 w-auto mx-auto"
            />
          ) : (
            <Building2 className="h-12 w-12 mx-auto text-primary" />
          )}
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl">Welcome to {companyName}</CardTitle>
            <CardDescription>
              Complete your onboarding to access the recruiter dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                type="email"
                value={recruiterEmail}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password (Optional - for future login)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                If you skip this, we'll email you a login link each time
              </p>
            </div>

            {password && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {password ? 'Accepting Invite...' : 'Sending Email...'}
                </>
              ) : (
                'Accept Invite & Continue'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              By accepting, you agree to the terms and conditions
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}