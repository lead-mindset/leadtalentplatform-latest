import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUserWithRole } from '@/lib/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Mail,
  Phone,
  Linkedin,
  GraduationCap,
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react'
import { ApproveMemberButton, RejectMemberButton } from './components/member-actions'
import { MembersTabs } from './member-tabs'

import type { MemberWithProfile } from '@/lib/types'

async function getChapterMembers(
  chapterId: string
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('User')
    .select(`
      id,
      email,
      name,
      phone,
      role,
      chapterId,
      createdAt,
      updatedAt,
      StudentProfile:StudentProfile!StudentProfile_userId_fkey (
        userId,
        major,
        graduationYear,
        linkedinUrl,
        skills,
        consentRecruiterVisibility,
        isRecruiterVisible,
        approvedById,
        isFilled,
        updatedAt,
        createdAt,
        consentDate
      ),
      Chapter (
        id,
        name,
        university,
        city,
        region,
        createdAt,
        updatedAt
      )
    `)
    .eq('chapterId', chapterId)
    .order('createdAt', { ascending: false })

  if (error || !data) {
    console.error('Failed to fetch chapter members:', error)
    return []
  }
  return data.map(member => ({
    ...member,
    StudentProfile: Array.isArray(member.StudentProfile)
      ? member.StudentProfile[0] ?? null
      : member.StudentProfile ?? null,
    Chapter: Array.isArray(member.Chapter)
      ? member.Chapter[0] ?? null
      : member.Chapter ?? null
  })) as MemberWithProfile[]
}

function getMemberStats(members: MemberWithProfile[]) {
  const pending = members.filter(
    m =>
      m.StudentProfile?.isFilled === true &&
      m.StudentProfile?.approvedById === null
  )

  const approved = members.filter(
    m => m.StudentProfile?.approvedById !== null
  )

  const incomplete = members.filter(
    m => !m.StudentProfile?.isFilled
  )

  return {
    total: members.length,
    pending: pending.length,
    approved: approved.length,
    incomplete: incomplete.length
  }
}

function filterMembers(
  members: MemberWithProfile[],
  status: 'all' | 'pending' | 'approved' | 'incomplete'
) {
  switch (status) {
    case 'pending':
      return members.filter(
        m =>
          m.StudentProfile?.isFilled === true &&
          m.StudentProfile?.approvedById === null
      )
    case 'approved':
      return members.filter(m => m.StudentProfile?.approvedById !== null)
    case 'incomplete':
      return members.filter(m => !m.StudentProfile?.isFilled)
    default:
      return members
  }
}


function MemberCard({
  member,
  currentUserId
}: {
  member: MemberWithProfile
  currentUserId: string
}) {
  const profile = member.StudentProfile
  const isPending = profile?.isFilled === true && profile?.approvedById === null
  const isApproved = profile?.approvedById !== null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {member.name ?? 'No name provided'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              {member.email}
            </CardDescription>
          </div>

          <div className="flex flex-col items-end gap-2">
            {isPending && (
              <Badge variant="outline" className="border-orange-500 text-orange-700">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
            {isApproved && (
              <Badge variant="outline" className="border-green-500 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            )}
            {!profile?.isFilled && (
              <Badge variant="outline" className="border-gray-400 text-gray-600">
                Incomplete
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {profile?.isFilled ? (
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm">
            {member.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {member.phone}
              </div>
            )}

            {profile.major && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                {profile.major}
              </div>
            )}

            {profile.graduationYear && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Class of {profile.graduationYear}
              </div>
            )}

            {profile.linkedinUrl && (
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-blue-600" />
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}

            {profile.skills?.length && (
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {isPending && (
            <div className="flex gap-2 pt-4 border-t">
              <ApproveMemberButton
                userId={member.id}
                editorId={currentUserId}
                userName={member.name ?? member.email}
              />
              <RejectMemberButton
                userId={member.id}
                userName={member.name ?? member.email}
              />
            </div>
          )}

          {isApproved && (
            <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
              <UserCheck className="h-4 w-4 text-green-600" />
              Approved on {new Date(profile.updatedAt).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This member hasn’t completed their profile yet.
          </p>
        </CardContent>
      )}
    </Card>
  )
}


export default async function ChapterMembersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: 'all' | 'pending' | 'approved' | 'incomplete' }>
}) {
  const { status = 'all' } = await searchParams

  const { supabase, user } = await requireUserWithRole('editor')

  if (!user.chapterId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card>
          <CardHeader className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div>
              <CardTitle>No Chapter Assigned</CardTitle>
              <CardDescription>
                You are not currently assigned to a chapter.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const allMembers = await getChapterMembers(user.chapterId)
  const stats = getMemberStats(allMembers)
  const displayMembers = filterMembers(allMembers, status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chapter Members</h1>
        <p className="text-muted-foreground mt-2">
          Manage members from {user.Chapter?.name}
        </p>
      </div>

      <MembersTabs currentStatus={status} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pending}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incomplete
            </CardTitle>
            <div className="text-2xl font-bold text-gray-500">
              {stats.incomplete}
            </div>
          </CardHeader>
        </Card>
      </div>

      {displayMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 opacity-50" />
            <p className="text-muted-foreground mt-2">
              No members found in this category
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {displayMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              currentUserId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
