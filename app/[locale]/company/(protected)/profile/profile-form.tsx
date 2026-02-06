'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/actions/company/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, User, Briefcase, Phone, Building2 } from 'lucide-react'

interface ProfileFormProps {
  user: {
    id: string
    email: string
    name?: string
    role: string
  }
  profile?: {
    phone?: string
    title?: string
    department?: string
    skills?: string[]
    isFilled?: boolean
  } | null
  company?: {
    id: string
    name: string
    logo?: string
  } | null
}

export default function ProfileForm({ user, profile, company }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: profile?.phone || '',
    title: profile?.title || '',
    department: profile?.department || '',
    skills: profile?.skills?.join(', ') || '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        title: formData.title,
        department: formData.department,
        skills: formData.skills
          ? formData.skills.split(',').map(s => s.trim())
          : [],
      })

      if (!result.success) {
        toast.error('Profile update failed', {
          description: result.error || 'Something went wrong',
        })
      } else {
        toast.success('Profile updated', {
          description: result.message,
        })
      }
    } catch {
      toast.error('Unexpected error', {
        description: 'Please try again later',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-4">
              {company.logo && (
                <img src={company.logo} alt={company.name} className="h-12 w-12 rounded" />
              )}
              <div>
                <p className="font-semibold">{company.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Information
          </CardTitle>
          <CardDescription>
            Share your role and expertise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Senior Recruiter"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                type="text"
                placeholder="Human Resources"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              type="text"
              placeholder="Technical Recruiting, Talent Acquisition, Interviewing"
              value={formData.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter skills separated by commas
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.href = '/company'}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </div>
    </form>
  )
}