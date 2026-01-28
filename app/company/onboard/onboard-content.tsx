'use client'

import { useState } from 'react'
import { acceptInvite } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Building2, Mail, Loader2 } from 'lucide-react'

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
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-4">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="h-12 w-auto mx-auto"
            />
          ) : (
            <Building2 className="h-12 w-12 mx-auto text-blue-600" />
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
                className="bg-gray-50"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
                  Accepting Invite...
                </>
              ) : (
                'Accept Invite & Continue'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By accepting, you agree to the terms and conditions
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}