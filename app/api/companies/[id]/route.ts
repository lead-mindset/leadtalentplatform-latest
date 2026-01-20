import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CompanySchema = z.object({
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

// GET: List all companies
export async function GET(req: NextRequest) {
  const supabase = await createClient()

  try {
    await requireAdmin(supabase)

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    let query = supabase
      .from('Company')
      .select(`
        id,
        name,
        createdat,
        createdbyid,
        createdBy:User!Company_createdbyid_fkey(name, email)
      `)
      .order('createdat', { ascending: false })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: companies, error } = await query

    if (error) {
      console.error('Failed to fetch companies:', error)
      throw error
    }

    return NextResponse.json({ companies })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Failed to fetch companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new company
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  try {
    const admin = await requireAdmin(supabase)

    const body = await req.json()
    const { name } = CompanySchema.parse(body)

    // Check if company already exists
    const { data: existing } = await supabase
      .from('Company')
      .select('id, name')
      .eq('name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A company with this name already exists' },
        { status: 409 }
      )
    }

    // Create company
    const { data: company, error: createError } = await supabase
      .from('Company')
      .insert({
        name,
        createdbyid: admin.id,
      })
      .select('id, name, createdat')
      .single()

    if (createError) {
      console.error('Failed to create company:', createError)
      throw createError
    }

    return NextResponse.json({ 
      success: true,
      company 
    }, { status: 201 })

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

    console.error('Failed to create company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}