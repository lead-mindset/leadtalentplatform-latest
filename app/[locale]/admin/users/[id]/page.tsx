import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Linkedin,
  Mail,
  Phone,
  Shield,
  UserRound,
  XCircle,
} from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getCompanyAccessForUser, getUserById } from '@/lib/actions/admin/get-data'
import { createClient } from '@/lib/supabase/server'
import { AdminService } from '@/lib/services/admin.service'
import { LeadIdentityService } from '@/lib/services/lead-identity.service'
import { MemberActionButtons } from '@/app/[locale]/chapter/members/components/member-actions'
import { AdminChapterRoleCorrectionPanel } from '@/app/[locale]/admin/users/[id]/_components/admin-chapter-role-correction-panel'
import { LeadIdentityManager } from '@/app/[locale]/admin/users/[id]/_components/lead-identity-manager'
import { RoleManagementPanel } from '@/app/[locale]/admin/users/[id]/_components/role-management-panel'
import { getRoleColor } from '@/lib/options'
import { formatLeadDate } from '@/lib/utils/date-format'

function formatDate(value: string | null | undefined) {
  return formatLeadDate(value, 'Not set')
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-dashed p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

function membershipVariant(status?: string | null) {
  if (status === 'approved') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'destructive'
  if (status === 'alumni') return 'info'
  return 'outline'
}

function companyAccessVariant(status: string) {
  if (status === 'active') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'revoked') return 'destructive'
  return 'outline'
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  const user = await getUserById(id)

  if (!user) notFound()
  const resolvedUser = user
  const profile = resolvedUser.person_profile
  const membership = resolvedUser.chapter_membership

  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: currentUserData } = currentUser
    ? await supabase
        .from('user')
        .select('role')
        .eq('id', currentUser.id)
        .single()
    : { data: null }

  const canApprove =
    currentUserData &&
    (currentUserData.role === 'admin' || currentUserData.role === 'editor')

  const [identityResult, chaptersResult, companyAccess] = await Promise.all([
    LeadIdentityService.getActiveIdentities(supabase, resolvedUser.id),
    AdminService.getAllChapters(supabase),
    getCompanyAccessForUser(resolvedUser.id, resolvedUser.email),
  ])
  const identities = identityResult.success ? identityResult.identities : []
  const chapters = 'chapters' in chaptersResult ? chaptersResult.chapters : []
  const primaryIdentity = identities.find((identity) => identity.is_primary)

  const approvalStatus = membership?.status ?? null
  const actionableStatus =
    approvalStatus === 'pending' || approvalStatus === 'approved'
      ? approvalStatus
      : null

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" asChild className="w-fit px-0">
            <Link href="/admin/users" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to users
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{resolvedUser.name ?? 'Unnamed user'}</h1>
              <Badge className={getRoleColor(resolvedUser.role)} variant="outline">
                {resolvedUser.role}
              </Badge>
              {resolvedUser.deactivated_at && <Badge variant="destructive">Deactivated</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <a href={`mailto:${resolvedUser.email}`} className="inline-flex items-center gap-2 hover:text-foreground">
                <Mail className="h-4 w-4" />
                {resolvedUser.email}
              </a>
              {resolvedUser.phone && (
                <a href={`tel:${resolvedUser.phone}`} className="inline-flex items-center gap-2 hover:text-foreground">
                  <Phone className="h-4 w-4" />
                  {resolvedUser.phone}
                </a>
              )}
              {profile?.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-foreground"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[32rem]">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Profile</p>
            <p className="mt-2 font-semibold">{profile ? 'Present' : 'Missing'}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Membership</p>
            <p className="mt-2 font-semibold">{membership?.status ?? 'None'}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Primary identity</p>
            <p className="mt-2 truncate font-semibold">{primaryIdentity?.identity_type ?? 'None'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-4 w-4" />
                Person Profile
              </CardTitle>
              <CardDescription>Reusable participant data. This does not imply chapter membership.</CardDescription>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <InfoRow label="University" value={profile.university ?? 'Not set'} />
                  <InfoRow label="Major or interest" value={profile.major_or_interest ?? 'Not set'} />
                  <InfoRow label="Graduation year" value={profile.graduation_year ?? 'Not set'} />
                  <InfoRow label="Gender" value={profile.gender ?? 'Not set'} />
                  <InfoRow
                    label="Company visibility"
                    value={
                      <span className="inline-flex items-center gap-2">
                        {profile.is_recruiter_visible ? (
                          <Eye className="h-4 w-4 text-success" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        {profile.is_recruiter_visible ? 'Visible to company representatives' : 'Not visible'}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Portfolio"
                    value={
                      profile.portfolio_url ? (
                        <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Open portfolio
                        </a>
                      ) : (
                        'Not set'
                      )
                    }
                  />
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={UserRound}
                  title="No person profile yet"
                  description="This user has not completed reusable profile details. They can still have an account without chapter membership."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Chapter Membership
              </CardTitle>
              <CardDescription>Chapter participation is explicit and reviewable.</CardDescription>
            </CardHeader>
            <CardContent>
              {membership ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <InfoRow
                    label="Status"
                    value={<Badge variant={membershipVariant(membership.status)}>{membership.status}</Badge>}
                  />
                  <InfoRow label="Position" value={membership.position ?? 'member'} />
                  <InfoRow label="Member ID" value={membership.member_id ?? 'Not issued'} />
                  <InfoRow label="Joined" value={formatDate(membership.joined_at)} />
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chapter</p>
                    <p className="font-medium">{membership.chapter?.name ?? 'Unknown chapter'}</p>
                    <p className="text-sm text-muted-foreground">{membership.chapter?.university ?? 'University not set'}</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  title="No chapter membership"
                  description="This is normal for public participants, company representatives, staff, or users who have not applied to a chapter."
                />
              )}
            </CardContent>
          </Card>

          <LeadIdentityManager
            userId={resolvedUser.id}
            userRole={resolvedUser.role}
            identities={identities}
            chapters={chapters}
            defaultChapterId={membership?.chapter_id}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BriefcaseBusiness className="h-4 w-4" />
                Company Access
              </CardTitle>
              <CardDescription>Company representative access records connected to this account or email.</CardDescription>
            </CardHeader>
            <CardContent>
              {companyAccess.length > 0 ? (
                <div className="divide-y">
                  {companyAccess.map((access) => (
                    <div key={access.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{access.company_name ?? 'Unknown company'}</p>
                        <p className="truncate text-sm text-muted-foreground">{access.recruiter_email}</p>
                        <p className="text-xs text-muted-foreground">
                          Granted {formatDate(access.granted_at)}
                          {access.accepted_at ? ` / Accepted ${formatDate(access.accepted_at)}` : ''}
                        </p>
                      </div>
                      <Badge variant={companyAccessVariant(access.status)}>{access.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BriefcaseBusiness}
                  title="No company access"
                  description="No company representative access is connected to this user or email."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <RoleManagementPanel
            userId={resolvedUser.id}
            userEmail={resolvedUser.email}
            currentRole={resolvedUser.role}
            membershipStatus={membership?.status}
            membershipPosition={membership?.position}
            chapterName={membership?.chapter?.name}
          />

          {canApprove && profile && actionableStatus && currentUser && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  Membership Review
                </CardTitle>
                <CardDescription>
                  {actionableStatus === 'approved'
                    ? 'This membership is approved. Revoke membership only when chapter status should change.'
                    : 'Review this chapter membership application.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MemberActionButtons
                  userId={resolvedUser.id}
                  userName={resolvedUser.name ?? resolvedUser.email}
                  currentState={actionableStatus}
                />
              </CardContent>
            </Card>
          )}

          {currentUserData?.role === 'admin' && membership?.status === 'approved' && (
            <AdminChapterRoleCorrectionPanel
              userId={resolvedUser.id}
              userName={resolvedUser.name ?? resolvedUser.email}
              chapters={chapters}
              defaultChapterId={membership.chapter_id}
              assignment={resolvedUser.chapter_role_assignment}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IdCard className="h-4 w-4" />
                Account Record
              </CardTitle>
              <CardDescription>Immutable-ish account metadata from the auth-facing user record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Created" value={formatDate(resolvedUser.created_at)} />
              <Separator />
              <InfoRow label="Updated" value={formatDate(resolvedUser.updated_at)} />
              <Separator />
              <InfoRow
                label="State"
                value={
                  resolvedUser.deactivated_at ? (
                    <span className="inline-flex items-center gap-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      Deactivated {formatDate(resolvedUser.deactivated_at)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      Active
                    </span>
                  )
                }
              />
              <Separator />
              <InfoRow
                label="Onboarding"
                value={
                  profile ? (
                    <span className="inline-flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      Basic profile present
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Not completed
                    </span>
                  )
                }
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
