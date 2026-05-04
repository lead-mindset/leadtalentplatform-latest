import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { getCompanyById, getCompanyStats } from '@/lib/actions/admin/companies'
import { ManageCompanyClient } from './manage-company-client'

export default async function CompanyManagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [company, stats] = await Promise.all([getCompanyById(id), getCompanyStats(id)])
  if (!company) notFound()
  const resolvedCompany = company ?? notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link href="/admin/companies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Link>
          </Button>
          <h1 className="text-4xl font-bold tracking-tight">{resolvedCompany.name}</h1>
          <p className="text-muted-foreground mt-2">
            Created {new Date(resolvedCompany.created_at).toLocaleDateString()} by {resolvedCompany.created_by_name ?? 'Unknown'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Active Representatives</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats.active_recruiters}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Pending Invites</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats.pending_invites}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Resume Views</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalViews}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Resume Downloads</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalDownloads}</CardContent>
        </Card>
      </div>

      <ManageCompanyClient company={resolvedCompany} />
    </div>
  )
}
