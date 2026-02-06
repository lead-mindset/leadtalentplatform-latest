import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateCompanyForm } from './form'
import { Suspense } from 'react'

async function AuthCheck() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: userData } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    redirect('/student')
  }

  return <CreateCompanyForm userId={user.id} />
}

function FormLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
      <div className="h-10 bg-muted rounded w-full" />
    </div>
  )
}

export default function AdminCreateCompanyPage() {
  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/admin/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Company</h1>
        <p className="text-muted-foreground mt-2">
          Add a new partner company to the platform
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Enter the details for the new company. This company will be able to invite recruiters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormLoading />}>
            <AuthCheck />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}