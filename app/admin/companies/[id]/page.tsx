'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Recruiter {
  id: string
  recruiterEmail: string
  isActive: boolean
  grantedAt: string
  acceptedAt: string | null
  revokedAt: string | null
}

export default function CompanyDetailsPage() {
  const params = useParams()
  const companyId = params.id as string

  const [company, setCompany] = useState<any>(null)
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [companyRes, recruitersRes] = await Promise.all([
          fetch(`/api/companies/${companyId}`),
          fetch(`/api/companies/${companyId}/recruiters`),
        ])

        const [companyData, recruitersData] = await Promise.all([
          companyRes.json(),
          recruitersRes.json(),
        ])

        if (companyData.company) setCompany(companyData.company)
        if (recruitersData.recruiters) setRecruiters(recruitersData.recruiters)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [companyId])

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)

    try {
      const res = await fetch(`/api/companies/${companyId}/recruiters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterEmail: email }),
      })

      const data = await res.json()

      if (res.ok) {
        alert('Invitation sent successfully!')
        setEmail('')
        const recruitersRes = await fetch(`/api/companies/${companyId}/recruiters`)
        const recruitersData = await recruitersRes.json()
        if (recruitersData.recruiters) setRecruiters(recruitersData.recruiters)
      } else {
        alert(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      alert('Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  async function revokeAccess(token: string) {
    if (!confirm('Are you sure you want to revoke this recruiter\'s access?')) return

    try {
      const res = await fetch(`/api/invites/${token}/revoke`, {
        method: 'POST',
      })

      if (res.ok) {
        alert('Access revoked successfully')
        const recruitersRes = await fetch(`/api/companies/${companyId}/recruiters`)
        const recruitersData = await recruitersRes.json()
        if (recruitersData.recruiters) setRecruiters(recruitersData.recruiters)
      }
    } catch (error) {
      alert('Failed to revoke access')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{company?.name}</h1>
        <p className="text-muted-foreground">
          Manage company details and recruiters
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input value={company?.name || ''} disabled />
          </div>
          <div>
            <Label>Created</Label>
            <Input value={new Date(company?.createdat).toLocaleDateString() || ''} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite Recruiter</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendInvite} className="space-y-4">
            <div>
              <Label htmlFor="email">Recruiter Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="recruiter@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recruiters ({recruiters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {recruiters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recruiters yet</p>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Granted</th>
                    <th className="text-left p-4">Accepted</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recruiters.map((recruiter) => (
                    <tr key={recruiter.id} className="border-t">
                      <td className="p-4">{recruiter.recruiterEmail}</td>
                      <td className="p-4">
                        {recruiter.revokedAt ? (
                          <span className="text-red-600">Revoked</span>
                        ) : recruiter.isActive ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )}
                      </td>
                      <td className="p-4">{new Date(recruiter.grantedAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        {recruiter.acceptedAt ? new Date(recruiter.acceptedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4 text-right">
                        {recruiter.isActive && !recruiter.revokedAt && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => revokeAccess(recruiter.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}