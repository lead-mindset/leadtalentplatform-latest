'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Invite {
  id: string
  recruiterEmail: string
  isActive: boolean
  grantedAt: string
  acceptedAt: string | null
  revokedAt: string | null
  inviteToken: string
  company: {
    name: string
  }
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'revoked'>('all')

  useEffect(() => {
    async function fetchInvites() {
      try {
        const res = await fetch('/api/invites')
        const data = await res.json()
        if (data.recruiters) setInvites(data.recruiters)
      } catch (error) {
        console.error('Failed to fetch invites:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvites()
  }, [])

  const filteredInvites = invites.filter((invite) => {
    if (filter === 'pending') return !invite.acceptedAt && !invite.revokedAt
    if (filter === 'accepted') return invite.acceptedAt && !invite.revokedAt
    if (filter === 'revoked') return invite.revokedAt
    return true
  })

  async function revokeInvite(token: string) {
    if (!confirm('Are you sure you want to revoke this invite?')) return

    try {
      const res = await fetch(`/api/invites/${token}/revoke`, {
        method: 'POST',
      })

      if (res.ok) {
        const res = await fetch('/api/invites')
        const data = await res.json()
        if (data.recruiters) setInvites(data.recruiters)
      }
    } catch (error) {
      alert('Failed to revoke invite')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Invitations</h1>
        <p className="text-muted-foreground">Manage recruiter invitations across all companies</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'accepted' ? 'default' : 'outline'}
          onClick={() => setFilter('accepted')}
        >
          Accepted
        </Button>
        <Button
          variant={filter === 'revoked' ? 'default' : 'outline'}
          onClick={() => setFilter('revoked')}
        >
          Revoked
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Company</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Granted</th>
                <th className="text-left p-4">Accepted</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvites.map((invite) => (
                <tr key={invite.id} className="border-t">
                  <td className="p-4">{invite.recruiterEmail}</td>
                  <td className="p-4">{invite.company.name}</td>
                  <td className="p-4">
                    {invite.revokedAt ? (
                      <span className="text-red-600">Revoked</span>
                    ) : invite.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </td>
                  <td className="p-4">{new Date(invite.grantedAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    {invite.acceptedAt ? new Date(invite.acceptedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4 text-right">
                    {invite.isActive && !invite.revokedAt && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeInvite(invite.inviteToken)}
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
    </div>
  )
}