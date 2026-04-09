'use client'

import { useState } from 'react'
import { acceptInvite } from '@/lib/actions/company/handle-invite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, Info, Lock } from 'lucide-react'

export default function OnboardContent({
  inviteToken,
  companyName,
  recruiterEmail,
}: {
  inviteToken: string
  companyName: string | null
  recruiterEmail: string
}) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    warning?: string
    error?: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await acceptInvite({
      inviteToken,
      name: name.trim(),
    })

    setResult(res)
    setLoading(false)
  }

  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 via-secondary/10 to-accent/5">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">
                {result.warning ? 'Almost Done!' : 'Check Your Email'}
              </CardTitle>
              <CardDescription className="mb-4">
                {result.message || result.warning}
              </CardDescription>
              <p className="text-sm text-muted-foreground">
                Login link sent to <strong className="text-foreground">{recruiterEmail}</strong>
              </p>
              {result.warning && (
                <Button asChild className="mt-6">
                  <a href="/company/login">
                    Go to Login
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 via-secondary/10 to-accent/5">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">
            Welcome to {companyName || 'the Team'}!
          </CardTitle>
          <CardDescription>
            Complete your profile to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                value={recruiterEmail}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            {result?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>

            <Alert>
              <Lock className="h-4 w-4 text-primary" />
              <AlertDescription className="ml-2">
                <strong className="text-foreground">Passwordless login:</strong>{' '}
                <span className="text-muted-foreground">
                  You'll receive a secure login link via email each time you sign in. No password needed!
                </span>
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}