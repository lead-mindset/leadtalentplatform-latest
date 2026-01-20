import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CompanyUpdateSchema = z.object({
  name: z.string().min(1, "Company name required").max(100),
})

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error("Unauthorized")
  }

  const { data: dbUser } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbUser?.role !== 'admin') {
    throw new Error("Forbidden")
  }

  return user
}

// GET: Fetch single company details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const companyId = params.id

  try {
    await requireAdmin(supabase)

    const { data: company, error } = await supabase
      .from('Company')
      .select(`
        id,
        name,
        createdat,
        createdbyid,
        createdBy:User!Company_createdbyid_fkey(name, email)
      `)
      .eq('id', companyId)
      .single()

    if (error || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Also fetch recruiter count for this company
    const { count: recruiterCount } = await supabase
      .from('RecruiterAccess')
      .select('*', { count: 'exact', head: true })
      .eq('companyId', companyId)
      .eq('isActive', true)
      .is('revokedAt', null)

    return NextResponse.json({
      ...company,
      recruiterCount: recruiterCount || 0
    })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to fetch company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update company
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const companyId = params.id

  try {
    await requireAdmin(supabase)

    const body = await req.json()
    const { name } = CompanyUpdateSchema.parse(body)

    // Check if new name conflicts with existing company
    const { data: existing } = await supabase
      .from('Company')
      .select('id')
      .eq('name', name)
      .neq('id', companyId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A company with this name already exists' },
        { status: 409 }
      )
    }

    // Update company
    const { data: company, error: updateError } = await supabase
      .from('Company')
      .update({ name })
      .eq('id', companyId)
      .select('id, name, createdat')
      .single()

    if (updateError) {
      console.error('Failed to update company:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      company
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to update company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete company
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const companyId = params.id

  try {
    await requireAdmin(supabase)

    // Check if company has any active recruiters
    const { count: recruiterCount } = await supabase
      .from('RecruiterAccess')
      .select('*', { count: 'exact', head: true })
      .eq('companyId', companyId)
      .eq('isActive', true)
      .is('revokedAt', null)

    if (recruiterCount && recruiterCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete company with active recruiters. Revoke all access first.' },
        { status: 409 }
      )
    }

    // Delete company (this will fail if there are any RecruiterAccess records due to FK constraint)
    // You might want to soft-delete instead or cascade delete
    const { error: deleteError } = await supabase
      .from('Company')
      .delete()
      .eq('id', companyId)

    if (deleteError) {
      console.error('Failed to delete company:', deleteError)
      
      // If FK constraint error, provide helpful message
      if (deleteError.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete company with existing recruiter records. Consider revoking access instead.' },
          { status: 409 }
        )
      }
      
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully'
    })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to delete company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}