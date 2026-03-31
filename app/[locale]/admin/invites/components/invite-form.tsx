'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Loader2 } from 'lucide-react'
import { createRecruiterInvite } from '@/lib/actions/admin/invite-recruiter'
import type { Company } from '@/lib/types'

interface InviteFormProps {
  companies: Company[]
}

export function InviteForm({ companies }: InviteFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const email = formData.get('email') as string
    const companyId = formData.get('companyId') as string
    const expiresInDays = parseInt(formData.get('expiresInDays') as string) || 7

    const result = await createRecruiterInvite({ recruiterEmail: email, companyId, expiresInDays })

    if (result.success) {
      setSuccess(result.message || 'Invitation sent successfully')
      form.reset()
      setTimeout(() => {
        setSuccess(null)
        router.refresh()
      }, 1500)
    } else {
      setError(result.error || 'Failed to send invitation')
    }

    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Recruiter Invitation</CardTitle>
        <CardDescription>
          Invite a recruiter to access student profiles for a specific company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recruiter Email *</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="recruiter@company.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyId">Company *</Label>
            <Select name="companyId" required disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresInDays">Expiration (days)</Label>
            <Select name="expiresInDays" defaultValue="7" disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-success-muted text-success rounded-lg text-sm">
              {success}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invitation
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}