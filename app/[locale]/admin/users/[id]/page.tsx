import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {Link} from '@/i18n/routing'
import { ArrowLeft, Mail, Phone, Calendar, Building2, GraduationCap, Linkedin, CheckCircle2, XCircle, Clock, Eye, EyeOff, Shield } from 'lucide-react'
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

  if (!user) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  const { data: currentUserData } = currentUser 
    ? await supabase
        .from('User')
        .select('role')
        .eq('id', currentUser.id)
        .single()
    : { data: null }

  const canApprove = currentUserData && (currentUserData.role === 'admin' || currentUserData.role === 'editor')
  const profile = user.StudentProfile
  const isPending = profile?.isFilled === true && profile?.approvedById === null
  const isApproved = profile?.approvedById !== null

  const getStatusConfig = () => {
    if (!profile?.isFilled) {
      return {
        label: 'Incomplete Profile',
        icon: Clock,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        description: 'Member needs to complete their profile'
      }
    }
    if (isApproved) {
      return {
        label: 'Approved',
        icon: CheckCircle2,
        color: 'text-chart-1',
        bgColor: 'bg-chart-1/10',
        description: 'Visible to recruiters'
      }
    }
    if (isPending) {
      return {
        label: 'Pending Approval',
        icon: Clock,
        color: 'text-chart-4',
        bgColor: 'bg-chart-4/10',
        description: 'Awaiting admin review'
      }
    }
    return {
      label: 'Not Ready',
      icon: XCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      description: 'Profile incomplete'
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
        
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl font-bold tracking-tight">{user.name}</h1>
                <Badge className={getRoleColor(user.role)} variant="outline">
                  {user.role}
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-muted-foreground">
                <a href={`mailto:${user.email}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </a>
                {user.phone && (
                  <>
                    <span className="hidden sm:block">•</span>
                    <a href={`tel:${user.phone}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{user.phone}</span>
                    </a>
                  </>
                )}
              </div>

              {profile?.linkedinUrl && (
                <a 
                  href={profile.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </a>
              )}
            </div>

            <div className={`${statusConfig.bgColor} rounded-lg p-4 min-w-[240px]`}>
              <div className="flex items-start gap-3">
                <StatusIcon className={`h-5 w-5 ${statusConfig.color} mt-0.5`} />
                <div className="space-y-1">
                  <div className={`font-semibold ${statusConfig.color}`}>
                    {statusConfig.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {statusConfig.description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {canApprove && profile && profile.isFilled && currentUser && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Admin Actions</CardTitle>
              </div>
              <CardDescription>
                {isApproved
                  ? 'This member is approved and visible to recruiters.'
                  : 'Review this member\'s profile and approve to make them visible to recruiters.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberActionButtons 
                userId={user.id}
                currentUserId={currentUser.id}
                userName={user.name ?? user.email}
                currentState={isApproved ? 'approved' : 'pending'}
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
                      <div className="font-medium">{profile.graduationYear}</div>
                    </div>

                    {profile.Chapter && (
                      <div className="sm:col-span-2 space-y-1">
                        <div className="text-sm text-muted-foreground">Chapter</div>
                        <div className="font-medium">{profile.Chapter.name}</div>
                        <div className="text-sm text-muted-foreground">{profile.Chapter.university}</div>
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
                      {profile.skills.map((skill, index) => (
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
                      {profile.isRecruiterVisible ? (
                        <Eye className="h-4 w-4 text-chart-1" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Recruiter Visible</span>
                    </div>
                    <Badge variant={profile.isRecruiterVisible ? "default" : "secondary"} className="text-xs">
                      {profile.isRecruiterVisible ? 'Yes' : 'No'}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {profile.consentRecruiterVisibility ? (
                        <CheckCircle2 className="h-4 w-4 text-chart-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Consent Given</span>
                    </div>
                    <Badge variant={profile.consentRecruiterVisibility ? "default" : "secondary"} className="text-xs">
                      {profile.consentRecruiterVisibility ? 'Yes' : 'No'}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {profile.isFilled ? (
                        <CheckCircle2 className="h-4 w-4 text-chart-1" />
                      ) : (
                        <Clock className="h-4 w-4 text-chart-4" />
                      )}
                      <span className="text-sm">Profile Complete</span>
                    </div>
                    <Badge variant={profile.isFilled ? "default" : "secondary"} className="text-xs">
                      {profile.isFilled ? 'Yes' : 'No'}
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
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Last Updated</div>
                    <div className="text-sm font-medium">
                      {new Date(user.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
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
                This user hasn't created a student profile yet. Academic information and skills will appear here once they complete their profile.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}