import { createClient } from '@/lib/supabase/server'
import type { 
  CompanyRaw, 
  Company, 
  RecruiterInvite, 
  RecruiterInviteRaw,
  UserWithDetailsRaw,
  UserWithDetails,
  ChapterRow,
  ActivityItem
} from '@/lib/types'

// ============================================================================
// SYSTEM STATS
// ============================================================================

export async function getSystemStats() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalChapters },
    { count: totalCompanies },
    { count: totalProfiles },
    { count: completeProfiles },
    { count: visibleProfiles },
    { count: pendingApprovals },
    { count: activeRecruiters },
    { count: pendingInvites }
  ] = await Promise.all([
    supabase.from('User').select('*', { count: 'exact', head: true }),
    supabase.from('Chapter').select('*', { count: 'exact', head: true }),
    supabase.from('Company').select('*', { count: 'exact', head: true }),
    supabase.from('StudentProfile').select('*', { count: 'exact', head: true }),
    supabase.from('StudentProfile').select('*', { count: 'exact', head: true }).eq('isFilled', true),
    supabase.from('StudentProfile').select('*', { count: 'exact', head: true }).eq('isRecruiterVisible', true),
    supabase.from('StudentProfile').select('*', { count: 'exact', head: true }).is('approvedById', null).eq('isFilled', true),
    supabase.from('RecruiterAccess').select('*', { count: 'exact', head: true }).eq('isActive', true),
    supabase.from('RecruiterAccess').select('*', { count: 'exact', head: true }).is('acceptedAt', null).is('revokedAt', null).gt('inviteExpiresAt', new Date().toISOString())
  ])

  const completionRate = totalProfiles && totalProfiles > 0 
    ? Math.round(((completeProfiles || 0) / totalProfiles) * 100)
    : 0

  return {
    totalUsers: totalUsers || 0,
    totalChapters: totalChapters || 0,
    totalCompanies: totalCompanies || 0,
    totalProfiles: totalProfiles || 0,
    completeProfiles: completeProfiles || 0,
    visibleProfiles: visibleProfiles || 0,
    pendingApprovals: pendingApprovals || 0,
    activeRecruiters: activeRecruiters || 0,
    pendingInvites: pendingInvites || 0,
    completionRate
  }
}

export async function getRecentActivity() {
  const supabase = await createClient()

  const { data: recentApprovals } = await supabase
    .from('StudentProfile')
    .select(`
      userId,
      updatedAt,
      User!StudentProfile_userId_fkey (
        name,
        email
      ),
      ApprovedBy:User!StudentProfile_approvedById_fkey (
        name
      )
    `)
    .not('approvedById', 'is', null)
    .order('updatedAt', { ascending: false })
    .limit(5)

  const { data: recentInvites } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      acceptedAt,
      recruiterEmail,
      Company (name),
      AcceptedBy:User!RecruiterAccess_acceptedByUserId_fkey (
        name
      )
    `)
    .not('acceptedAt', 'is', null)
    .order('acceptedAt', { ascending: false })
    .limit(5)

  return {
    recentApprovals: recentApprovals || [],
    recentInvites: recentInvites || []
  }
}


type ChapterWithCount = ChapterRow & {
  _count: {
    users: number
  }
}

export async function getChapters(): Promise<ChapterWithCount[]> {
  const supabase = await createClient()

  const { data: chapters, error } = await supabase
    .from('Chapter')
    .select('*')
    .order('name', { ascending: true })

  if (error || !chapters) {
    console.error('Failed to fetch chapters:', error)
    return []
  }

  const chaptersWithCounts = await Promise.all(
    chapters.map(async (chapter) => {
      const { count } = await supabase
        .from('StudentProfile')
        .select('*', { count: 'exact', head: true })
        .eq('chapterId', chapter.id)

      return {
        ...chapter,
        _count: {
          users: count || 0
        }
      }
    })
  )

  return chaptersWithCounts
}

function normalizeUserWithDetails(
  users: UserWithDetailsRaw[]
): UserWithDetails[] {
  return users.map(user => ({
    ...user,
    Chapter: user.Chapter[0] ?? null,
    StudentProfile: user.StudentProfile[0] ?? null,
  }))
}

export async function getUsers(): Promise<UserWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('User')
    .select(`
      id,
      email,
      name,
      role,
      phone,
      createdAt,
      updatedAt,
      StudentProfile!StudentProfile_userId_fkey (
        isFilled,
        approvedById,
        isRecruiterVisible,
        chapterId,
        Chapter (
          name,
          university
        )
      )
    `)
    .order('createdAt', { ascending: false })

  if (error || !data) {
    console.error("Failed to fetch users:", error)
    return []
  }

  return normalizeUserWithDetails(data as UserWithDetailsRaw[])
}

export async function getActivityLog(): Promise<ActivityItem[]> {
  const supabase = await createClient()

  const { data: approvals } = await supabase
    .from('StudentProfile')
    .select(`
      userId,
      updatedAt,
      chapterId,
      Student:User!StudentProfile_userId_fkey (
        name,
        email
      ),
      Chapter (name),
      ApprovedBy:User!StudentProfile_approvedById_fkey (
        name,
        email
      )
    `)
    .not('approvedById', 'is', null)
    .order('updatedAt', { ascending: false })
    .limit(20)

  const { data: invites } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      grantedAt,
      acceptedAt,
      revokedAt,
      recruiterEmail,
      Company (name),
      GrantedBy:User!RecruiterAccess_grantedById_fkey (
        name,
        email
      ),
      AcceptedBy:User!RecruiterAccess_acceptedByUserId_fkey (
        name,
        email
      ),
      RevokedBy:User!RecruiterAccess_revokedById_fkey (
        name,
        email
      )
    `)
    .order('grantedAt', { ascending: false })
    .limit(20)

  const activities: ActivityItem[] = []

  // Process approvals
  if (approvals) {
    approvals.forEach((approval: any) => {
      activities.push({
        id: `approval-${approval.userId}`,
        type: 'approval',
        timestamp: approval.updatedAt,
        actor: approval.ApprovedBy?.[0] ?? null,
        target: approval.Student?.[0] ?? null,
        chapter: approval.Chapter?.[0] ?? null
      })
    })
  }

  // Process invites
  if (invites) {
    invites.forEach((invite: any) => {
      // Invite sent
      activities.push({
        id: `invite-sent-${invite.id}`,
        type: 'invite_sent',
        timestamp: invite.grantedAt,
        actor: invite.GrantedBy?.[0] ?? null,
        target: { name: null, email: invite.recruiterEmail },
        company: invite.Company?.[0] ?? null
      })

      // Invite accepted
      if (invite.acceptedAt) {
        activities.push({
          id: `invite-accepted-${invite.id}`,
          type: 'invite_accepted',
          timestamp: invite.acceptedAt,
          actor: invite.AcceptedBy?.[0] ?? null,
          target: { name: null, email: invite.recruiterEmail },
          company: invite.Company?.[0] ?? null
        })
      }

      // Invite revoked
      if (invite.revokedAt) {
        activities.push({
          id: `invite-revoked-${invite.id}`,
          type: 'invite_revoked',
          timestamp: invite.revokedAt,
          actor: invite.RevokedBy?.[0] ?? null,
          target: { name: null, email: invite.recruiterEmail },
          company: invite.Company?.[0] ?? null
        })
      }
    })
  }

  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return activities.slice(0, 50)
}

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()

  const { data: companies, error } = await supabase
    .from('Company')
    .select(`
      id,
      name,
      createdat,
      createdbyid,
      CreatedBy:User!Company_createdbyid_fkey (
        name,
        email
      )
    `)
    .order('createdat', { ascending: false })

  if (error || !companies) {
    console.error('Failed to fetch companies:', error)
    return []
  }

  // Get recruiter counts for each company
  const companiesWithCounts = await Promise.all(
    (companies as CompanyRaw[]).map(async (company) => {
      const { count: activeCount } = await supabase
        .from('RecruiterAccess')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', company.id)
        .eq('isActive', true)

      const { count: pendingCount } = await supabase
        .from('RecruiterAccess')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', company.id)
        .is('acceptedAt', null)
        .is('revokedAt', null)
        .gt('inviteExpiresAt', new Date().toISOString())

      return {
        ...company,
        CreatedBy: company.CreatedBy[0] ?? null,
        _count: {
          activeRecruiters: activeCount || 0,
          pendingInvites: pendingCount || 0
        }
      }
    })
  )

  return companiesWithCounts as Company[]
}
function normalizeRecruiterInvites(
  invites: RecruiterInviteRaw[]
): RecruiterInvite[] {
  return invites.map(invite => ({
    ...invite,
    Company: Array.isArray(invite.Company) ? (invite.Company[0] ?? null) : null,
    GrantedBy: Array.isArray(invite.GrantedBy) ? (invite.GrantedBy[0] ?? null) : null,
    AcceptedBy: Array.isArray(invite.AcceptedBy) ? (invite.AcceptedBy[0] ?? null) : null,
  }))
}

export async function getInvites(): Promise<RecruiterInvite[]> {
  const supabase = await createClient()

  const { data: invites, error } = await supabase
    .from('RecruiterAccess')
    .select(`
      id,
      recruiterEmail,
      isActive,
      grantedAt,
      inviteExpiresAt,
      acceptedAt,
      revokedAt,
      companyId,
      Company (name),
      GrantedBy:User!RecruiterAccess_grantedById_fkey (
        name,
        email
      ),
      AcceptedBy:User!RecruiterAccess_acceptedByUserId_fkey (
        name,
        email
      )
    `)
    .order('grantedAt', { ascending: false })

  if (error || !invites) {
    console.error('Failed to fetch invites:', error)
    return []
  }

  return normalizeRecruiterInvites(invites as RecruiterInviteRaw[])
}