'use client'
import { useEffect, useState } from 'react'

interface Recruiter {
  id: string
  recruiterEmail: string
  companyName: string
  grantedById: string
  isActive: boolean
  grantedAt: string
}

export default function AdminDashboard() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)

  async function fetchRecruiters() {
    setLoading(true)
    const res = await fetch('/api/admin/recruiter-access')
    const data = await res.json()
    if (data.recruiters) setRecruiters(data.recruiters)
    setLoading(false)
  }

  async function addRecruiter(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/recruiter-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recruiterEmail: email, companyName: company }),
    })
    const data = await res.json()
    if (data.success) {
      setEmail('')
      setCompany('')
      fetchRecruiters()
    } else {
      alert(data.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRecruiters()
  }, [])

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <form onSubmit={addRecruiter}>
        <input
          type="email"
          placeholder="Recruiter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Company Name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Recruiter'}
        </button>
      </form>

      <h2>Recruiters</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {recruiters.map((r) => (
            <li key={r.id}>
              {r.recruiterEmail} - {r.companyName} - {r.isActive ? 'Active' : 'Inactive'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
