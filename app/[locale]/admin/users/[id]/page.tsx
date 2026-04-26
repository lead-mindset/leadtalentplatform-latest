import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/i18n/routing'
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Linkedin,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
} from 'lucide-react'
import { getUserById } from '@/lib/actions/admin/get-data'
import { createClient } from '@/lib/supabase/server'
import { MemberActionButtons } from '@/app/[locale]/chapter/members/components/member-actions'
import { getRoleColor } from '@/lib/options'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  const user = await getUserById(id)

  if (!user) notFound()
  const resolvedUser = user ?? notFound()

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

  const profile = resolvedUser.student_profile
  // approvalStatus is the single source of truth
  const approval_status = profile?.approval_status ?? 'pending'

  const getStatusConfig = () => {
    if (!profile?.is_filled) {
      return {
        label: 'Incomplete Profile',
        icon: Clock,
        colorClass: 'text-muted-foreground',
        bgClass: 'bg-muted',
        description: 'Member needs to complete their profile',
      }
    }

    switch (approval_status) {
      case 'approved':
        return {
          label: 'Approved',
          icon: CheckCircle2,
          colorClass: 'text-[var(--success)]',
          bgClass: 'bg-[var(--success-muted)]',
          description: profile.is_recruiter_visible
            ? 'Approved and visible to recruiters'
            : 'Approved but not visible to recruiters',
        }
      case 'rejected':
        return {
          label: 'Rejected',
          icon: XCircle,
          colorClass: 'text-destructive',
          bgClass: 'bg-destructive/10',
          description: 'Profile was reviewed and rejecte',
        }
      case 'pending':
      default:
        return {
          label: 'Pending Approval',
          icon: AlertCircle,
          colorClass: 'text-[var(--warning)]',
          bgClass: 'bg-[var(--warning-muted)]',
          description: 'Awaiting chapter editor or admin review',
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen">
      <div className="border-b bg-card/50">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-bold tracking-tight">{resolvedUser.name}</h1>
              <Badge className={getRoleColor(resolvedUser.role)} variant="outline">
                {resolvedUser.role}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-muted-foreground">
              <a
                href={`mailto:${resolvedUser.email}`}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm">{resolvedUser.email}</span>
              </a>
              {resolvedUser.phone && (
                <>
                  <span className="hidden sm:block">•</span>
                  <a
                    href={`tel:${resolvedUser.phone}`}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{resolvedUser.phone}</span>
                  </a>
                </>
              )}
            </div>
            {profile?.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--info)] hover:underline"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn Profile
              </a>
            )}
          </div>

          <div className={`${statusConfig.bgClass} rounded-lg p-4 min-w-[240px]`}>
            <div className="flex items-start gap-3">
              <StatusIcon className={`h-5 w-5 ${statusConfig.colorClass} mt-0.5`} />
              <div className="space-y-1">
                <div className={`font-semibold ${statusConfig.colorClass}`}>
                  {statusConfig.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {statusConfig.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {canApprove && profile?.is_filled && currentUser && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Admin Actions</CardTitle>
              </div>
              <CardDescription>
                {approval_status === 'approved'
                  ? 'This member is approved. You can revoke approval if needed.'
                  : approval_status === 'rejected'
                  ? 'This profile was rejected. You can reconsider and approve.'
                  : "Review this member's profile and approve or reject."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberActionButtons
                userId={resolvedUser.id}
                currentUserId={currentUser.id}
                userName={resolvedUser.name ?? resolvedUser.email}
                currentState={approval_status}
              />
            </CardContent>
          </Card>
        )}

        {profile ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Major</div>
                      <div className="font-medium">{profile.major}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Graduation Year</div>
                      <div className="font-medium">{profile.graduation_year}</div>
                    </div>
                    {profile.chapter && (
                      <div className="sm:col-span-2 space-y-1">
                        <div className="text-sm text-muted-foreground">Chapter</div>
                        <div className="font-medium">{profile.chapter.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {profile.chapter.university}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {profile.skills && profile.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Visibility Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {profile.is_recruiter_visible ? (
                        <Eye className="h-4 w-4 text-[var(--success)]" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Recruiter Visible</span>
                    </div>
                    <Badge
                      variant={profile.is_recruiter_visible ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {profile.is_recruiter_visible ? 'Yes' : 'No'}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {profile.consent_recruiter_visibility ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Consent Given</span>
                    </div>
                    <Badge
                      variant={profile.consent_recruiter_visibility ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {profile.consent_recruiter_visibility ? 'Yes' : 'No'}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {profile.is_filled ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                      ) : (
                        <Clock className="h-4 w-4 text-[var(--warning)]" />
                      )}
                      <span className="text-sm">Profile Complete</span>
                    </div>
                    <Badge
                      variant={profile.is_filled ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {profile.is_filled ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Member Since</div>
                    <div className="text-sm font-medium">
                      {new Date(resolvedUser.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Last Updated</div>
                    <div className="text-sm font-medium">
                      {new Date(resolvedUser.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Student Profile</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                This user hasn't created a student profile yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
