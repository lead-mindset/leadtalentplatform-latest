import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Suspense } from 'react'
import { Building, Plus, Mail, CheckCircle2, Clock } from 'lucide-react'
import { getCompanies } from '@/lib/actions/admin/get-data'

async function CompaniesList() {
  const companies = await getCompanies()

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first partner company to get started
          </p>
          <Button asChild>
            <Link href="/admin/companies/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const totalActive = companies.reduce((sum, c) => sum + (c._count?.activeRecruiters || 0), 0)
  const totalPending = companies.reduce((sum, c) => sum + (c._count?.pendingInvites || 0), 0)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recruiters</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>Partner companies with recruiter access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Company Name</th>
                  <th className="text-left p-3 font-medium">Created By</th>
                  <th className="text-left p-3 font-medium">Active Recruiters</th>
                  <th className="text-left p-3 font-medium">Pending Invites</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="font-medium">
                          {company.CreatedBy?.name || 'Unknown'}
                        </p>
                        <p className="text-muted-foreground">
                          {company.CreatedBy?.email}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {company._count?.activeRecruiters || 0}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {(company._count?.pendingInvites || 0) > 0 ? (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3 text-orange-500" />
                          {company._count?.pendingInvites}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(company.createdat).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/companies/${company.id}`}>
                            Manage
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/companies/${company.id}/invite`}>
                            <Mail className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminCompaniesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground mt-2">
            Manage partner companies and recruiter access
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CompaniesList />
      </Suspense>
    </div>
  )
}