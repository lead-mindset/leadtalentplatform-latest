import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Suspense } from 'react'
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
type MemberWithProfile = {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: string
  createdAt: string
  StudentProfile: {
    userId: string
    major: string | null
    graduationYear: number | null
    linkedinUrl: string | null
    skills: string[] | null
    consentRecruiterVisibility: boolean
    isRecruiterVisible: boolean | null
    approvedById: string | null
    isFilled: boolean | null
    updatedAt: string
  } | null
}

async function getChapterMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  chapterId: string
) {
  const { data: members, error } = await supabase
    .from('User')
    .select(`
      id,
      email,
      name,
      phone,
      role,
      createdAt,
      StudentProfile!StudentProfile_userId_fkey (
        userId,
        major,
        graduationYear,
        linkedinUrl,
        skills,
        consentRecruiterVisibility,
        isRecruiterVisible,
        approvedById,
        isFilled,
        updatedAt
      )
    `)
    .eq('chapterId', chapterId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Failed to fetch chapter members:', error)
    return []
  }

  return members || []
}

function MemberCard({ 
  member, 
  currentUserId 
}: { 
  member: MemberWithProfile
  currentUserId: string 
}) {
  const profile = member.StudentProfile
  const isPending = profile?.isFilled && !profile?.approvedById
  const isApproved = profile?.approvedById !== null
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {member.name || 'No name provided'}
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
      
      {profile?.isFilled && (
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm">
            {member.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{member.phone}</span>
              </div>
            )}
            
            {profile.major && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{profile.major}</span>
              </div>
            )}
            
            {profile.graduationYear && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Class of {profile.graduationYear}</span>
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
            
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.skills.map((skill) => (
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
                userName={member.name || member.email}
              />
              <RejectMemberButton 
                userId={member.id}
                userName={member.name || member.email}
              />
            </div>
          )}
          
          {isApproved && (
            <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span>
                Approved on {new Date(profile.updatedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      )}
      
      {!profile?.isFilled && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This member hasn't completed their profile yet.
          </p>
        </CardContent>
      )}
    </Card>
  )
}

async function MembersContent({ 
  chapterId, 
  currentUserId,
  status 
}: { 
  chapterId: string
  currentUserId: string
  status: string
}) {
  const supabase = await createClient()
  const allMembers = await getChapterMembers(supabase, chapterId)
  
  const pendingMembers = allMembers.filter(m => 
    m.StudentProfile?.isFilled === true && 
    m.StudentProfile?.approvedById === null
  )
  
  const approvedMembers = allMembers.filter(m => 
    m.StudentProfile?.approvedById !== null
  )
  
  const incompleteMembers = allMembers.filter(m => 
    !m.StudentProfile?.isFilled
  )

  const displayMembers = 
    status === 'pending' ? pendingMembers :
    status === 'approved' ? approvedMembers :
    status === 'incomplete' ? incompleteMembers :
    allMembers

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <div className="text-2xl font-bold">{allMembers.length}</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <div className="text-2xl font-bold text-orange-600">
              {pendingMembers.length}
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <div className="text-2xl font-bold text-green-600">
              {approvedMembers.length}
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incomplete
            </CardTitle>
            <div className="text-2xl font-bold text-gray-500">
              {incompleteMembers.length}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {status === 'pending' && 'Pending Approval'}
            {status === 'approved' && 'Approved Members'}
            {status === 'incomplete' && 'Incomplete Profiles'}
            {status === 'all' && 'All Members'}
          </h2>
          <Badge variant="outline">
            {displayMembers.length} {displayMembers.length === 1 ? 'member' : 'members'}
          </Badge>
        </div>

        {displayMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-center">
                No members found in this category
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {displayMembers.map((member) => (
              <MemberCard 
                key={member.id} 
                member={member} 
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MembersLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

async function PageContent({ status }: { status: string }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: userData } = await supabase
    .from('User')
    .select('role, chapterId, Chapter(name, university)')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'editor') {
    redirect('/student')
  }

  if (!userData.chapterId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <CardTitle>No Chapter Assigned</CardTitle>
                <CardDescription>
                  You are not currently assigned to a chapter.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chapter Members</h1>
        <p className="text-muted-foreground mt-2">
          Manage members from {userData.Chapter?.name}
        </p>
      </div>

      <Tabs value={status} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <a href="/chapter/members?status=all">All Members</a>
          </TabsTrigger>
          <TabsTrigger value="pending" asChild>
            <a href="/chapter/members?status=pending">Pending</a>
          </TabsTrigger>
          <TabsTrigger value="approved" asChild>
            <a href="/chapter/members?status=approved">Approved</a>
          </TabsTrigger>
          <TabsTrigger value="incomplete" asChild>
            <a href="/chapter/members?status=incomplete">Incomplete</a>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="space-y-4">
          <Suspense fallback={<MembersLoading />}>
            <MembersContent 
              chapterId={userData.chapterId}
              currentUserId={user.id}
              status={status}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </>
  )
}

function PageLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
      <MembersLoading />
    </div>
  )
}

export default function ChapterMembersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  // searchParams is now synchronous in the function signature
  const status = searchParams.status || 'all'

  return (
    <div className="space-y-6">
      <Suspense fallback={<PageLoading />}>
        <PageContent status={status} />
      </Suspense>
    </div>
  )
}