'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Company {
  id: string
  name: string
  createdat: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch('/api/companies')
        const data = await res.json()
        if (data.companies) setCompanies(data.companies)
      } catch (error) {
        console.error('Failed to fetch companies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage partner companies</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">Company Name</th>
                <th className="text-left p-4">Created</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-t">
                  <td className="p-4 font-medium">{company.name}</td>
                  <td className="p-4">{new Date(company.createdat).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/companies/${company.id}`}>
                        View Details
                      </Link>
                    </Button>
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