import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdminOrChapterEditor(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error("Unauthorized")
  }

  const { data: dbUser } = await supabase
    .from('User')
    .select('role, chapterId')
    .eq('id', user.id)
    .single()

  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'chapter_editor')) {
    throw new Error("Forbidden")
  }

  return { user, dbUser }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  try {
    const { user, dbUser } = await requireAdminOrChapterEditor(supabase)

    const { searchParams } = new URL(req.url)
    
    const action = searchParams.get('action') // 'approve', 'invite', 'revoke', etc.
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const activities: any[] = []

    if (!action || action === 'approve') {
      const { data: approvals } = await supabase
        .from('StudentProfile')
        .select(`
          userId,
          approvedById,
          updatedAt,
          user:User!StudentProfile_userId_fkey(name, email, chapterId),
          approver:User!StudentProfile_approvedById_fkey(name, email)
        `)
        .not('approvedById', 'is', null)
        .order('updatedAt', { ascending: false })

      if (approvals) {
        for (const approval of approvals) {
          if (dbUser.role === 'chapter_editor' && approval.user.chapterId !== dbUser.chapterId) {
            continue
          }

          activities.push({
            id: `approval-${approval.userId}`,
            action: 'approve',
            timestamp: approval.updatedAt,
            actor: {
              id: approval.approvedById,
              name: approval.approver?.name,
              email: approval.approver?.email,
            },
            target: {
              id: approval.userId,
              name: approval.user?.name,
              email: approval.user?.email,
            },
            metadata: {
              chapterId: approval.user?.chapterId,
            }
          })
        }
      }
    }

    // 2. Recruiter Invites (Admin only)
    if (dbUser.role === 'admin' && (!action || action === 'invite')) {
      const { data: invites } = await supabase
        .from('RecruiterAccess')
        .select(`
          id,
          recruiterEmail,
          grantedAt,
          grantedById,
          acceptedAt,
          revokedAt,
          companyId,
          granter:User!RecruiterAccess_grantedById_fkey(name, email),
          company:Company(name)
        `)
        .order('grantedAt', { ascending: false })

      if (invites) {
        for (const invite of invites) {
          activities.push({
            id: `invite-${invite.id}`,
            action: 'invite',
            timestamp: invite.grantedAt,
            actor: {
              id: invite.grantedById,
              name: invite.granter?.name,
              email: invite.granter?.email,
            },
            target: {
              email: invite.recruiterEmail,
            },
            metadata: {
              companyId: invite.companyId,
              companyName: invite.company?.name,
              acceptedAt: invite.acceptedAt,
              revokedAt: invite.revokedAt,
            }
          })
        }
      }
    }

    if (dbUser.role === 'admin' && (!action || action === 'revoke')) {
      const { data: revocations } = await supabase
        .from('RecruiterAccess')
        .select(`
          id,
          recruiterEmail,
          revokedAt,
          revokedById,
          companyId,
          revoker:User!RecruiterAccess_revokedById_fkey(name, email),
          company:Company(name)
        `)
        .not('revokedAt', 'is', null)
        .order('revokedAt', { ascending: false })

      if (revocations) {
        for (const revocation of revocations) {
          activities.push({
            id: `revoke-${revocation.id}`,
            action: 'revoke',
            timestamp: revocation.revokedAt,
            actor: {
              id: revocation.revokedById,
              name: revocation.revoker?.name,
              email: revocation.revoker?.email,
            },
            target: {
              email: revocation.recruiterEmail,
            },
            metadata: {
              companyId: revocation.companyId,
              companyName: revocation.company?.name,
            }
          })
        }
      }
    }

    if (dbUser.role === 'admin' && (!action || action === 'create_company')) {
      const { data: companies } = await supabase
        .from('Company')
        .select(`
          id,
          name,
          createdat,
          createdbyid,
          creator:User!Company_createdbyid_fkey(name, email)
        `)
        .order('createdat', { ascending: false })

      if (companies) {
        for (const company of companies) {
          activities.push({
            id: `company-${company.id}`,
            action: 'create_company',
            timestamp: company.createdat,
            actor: {
              id: company.createdbyid,
              name: company.creator?.name,
              email: company.creator?.email,
            },
            target: {
              id: company.id,
              name: company.name,
            },
            metadata: {}
          })
        }
      }
    }

    activities.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    let filtered = activities

    if (userId) {
      filtered = filtered.filter(a => 
        a.actor?.id === userId || a.target?.id === userId
      )
    }

    if (startDate) {
      const start = new Date(startDate)
      filtered = filtered.filter(a => new Date(a.timestamp) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      filtered = filtered.filter(a => new Date(a.timestamp) <= end)
    }

    const paginated = filtered.slice(offset, offset + limit)
    const total = filtered.length

    return NextResponse.json({
      activities: paginated,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    console.error('Failed to fetch activity logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}