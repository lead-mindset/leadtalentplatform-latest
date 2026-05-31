import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/routing'
import {
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { getProtectedLeadershipInviteState } from '@/lib/actions/admin/chapter-invites'
import { getChapterById, getChapterMembers } from '@/lib/actions/admin/get-data'
import { formatLeadDate } from '@/lib/utils/date-format'
import { ProtectedLeadershipInvites } from './protected-leadership-invites'

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  const chapter = await getChapterById(id)

  if (!chapter) notFound()
  const resolvedChapter = chapter ?? notFound()
  const members = await getChapterMembers(resolvedChapter.id)
  const protectedLeadership = await getProtectedLeadershipInviteState(resolvedChapter.id)
  const approved_members  = members.filter(m => m.chapter_membership?.status === 'approved')
  const pending_members   = members.filter(m => m.person_profile && m.chapter_membership?.status === 'pending')
  const rejected_members  = members.filter(m => m.chapter_membership?.status === 'rejected')
  const incomplete_members = members.filter(m => !m.person_profile)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/chapters">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chapters
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{resolvedChapter.name}</h1>
          <p className="text-muted-foreground mt-2">{resolvedChapter.university}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total chapter members</p>
            </CardContent>
          </Card>

          {(resolvedChapter.city || resolvedChapter.region) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Location</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resolvedChapter.city || resolvedChapter.region}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {resolvedChapter.city && resolvedChapter.region ? resolvedChapter.region : 'Chapter location'}
                </p>
              </CardContent>
            </Card>
          )}

          {resolvedChapter.created_at && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Created</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatLeadDate(resolvedChapter.created_at)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Chapter established</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chapter Information</CardTitle>
            <CardDescription>Details about this chapter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chapter ID</p>
                <p className="text-sm font-mono mt-1">{resolvedChapter.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm mt-1">
                  {formatLeadDate(resolvedChapter.updated_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProtectedLeadershipInvites
          chapterId={resolvedChapter.id}
          activeLeaders={protectedLeadership.activeLeaders}
          invites={protectedLeadership.invites}
        />

        {/* ── Member sections ── */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Members ({members.length})</h2>

          {pending_members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Approval ({pending_members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pending_members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          <Badge
                            variant="outline"
                            className="border-warning text-warning"
                          >
                            Pending
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/admin/users/${member.id}`}>Review</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {approved_members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Approved Members ({approved_members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approved_members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          <Badge
                            variant="outline"
                            className="border-success text-success"
                          >
                            Approved
                          </Badge>
                          {member.person_profile?.is_recruiter_visible && (
                            <Badge variant="secondary">Visible to Partner Companies</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${member.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {rejected_members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Rejected ({rejected_members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rejected_members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          <Badge variant="outline" className="border-destructive text-destructive">
                            Rejected
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${member.id}`}>Review</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {incomplete_members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  Incomplete Profiles ({incomplete_members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incomplete_members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          <Badge variant="outline" className="text-muted-foreground">
                            Incomplete
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${member.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {members.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                <p className="text-sm text-muted-foreground">
                  This chapter doesn&apos;t have any members yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
