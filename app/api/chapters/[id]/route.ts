import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ChapterSchema = z.object({
  id: z.string().min(1, "Chapter ID required"),
  name: z.string().min(1, "Chapter name required"),
  university: z.string().min(1, "University required"),
  city: z.string().optional(),
  region: z.string().optional(),
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

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: chapters, error } = await supabase
      .from('Chapter')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch chapters:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chapters' },
        { status: 500 }
      )
    }

    return NextResponse.json({ chapters })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  try {
    await requireAdmin(supabase)

    const body = await req.json()
    const parsed = ChapterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error },
        { status: 400 }
      )
    }

    const { id, name, university, city, region } = parsed.data

    const { data: existing } = await supabase
      .from('Chapter')
      .select('id')
      .eq('id', id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Chapter ID already exists' },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()

    const { data: chapter, error: insertError } = await supabase
      .from('Chapter')
      .insert({
        id,
        name,
        university,
        city,
        region,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create chapter:', insertError)
      return NextResponse.json(
        { error: 'Failed to create chapter' },
        { status: 500 }
      )
    }

    return NextResponse.json({ chapter }, { status: 201 })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}