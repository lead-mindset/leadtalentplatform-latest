import type { MemberWithProfile } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Clock,
  UserCheck,
  XCircle,
  Mail,
  Phone,
  Linkedin,
  GraduationCap,
  Calendar,
} from 'lucide-react'
import { MemberActionButtons } from "./member-actions"

export default function MemberCard({
  member,
  currentUserId
}: {
  member: MemberWithProfile
  currentUserId: string
}) {
  const profile = member.StudentProfile

  const approvalStatus = profile?.approvalStatus
  const isPending  = profile?.isFilled === true && approvalStatus === 'pending'
  const isApproved = approvalStatus === 'approved'
  const isRejected = approvalStatus === 'rejected'

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
              <Badge
                variant="outline"
                className="border-warning text-warning"
              >
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
            {isApproved && (
              <Badge
                variant="outline"
                className="border-success text-success"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            )}
            {isRejected && (
              <Badge
                variant="outline"
                className="border-destructive text-destructive"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Rejected
              </Badge>
            )}
            {!profile?.isFilled && (
              <Badge variant="outline" className="text-muted-foreground">
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
                <Linkedin className="h-4 w-4 text-info" />
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info hover:underline text-sm"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
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
            <div className="pt-4 border-t">
              <MemberActionButtons
                userId={member.id}
                currentUserId={currentUserId}
                userName={member.name ?? member.email}
                currentState="pending"
              />
            </div>
          )}

          {isApproved && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="h-4 w-4 text-success" />
                Approved on {new Date(profile.updatedAt).toLocaleDateString()}
              </div>
              <MemberActionButtons
                userId={member.id}
                currentUserId={currentUserId}
                userName={member.name ?? member.email}
                currentState="approved"
              />
            </div>
          )}

          {isRejected && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-destructive" />
                Rejected on {new Date(profile.updatedAt).toLocaleDateString()}
              </div>
              <MemberActionButtons
                userId={member.id}
                currentUserId={currentUserId}
                userName={member.name ?? member.email}
                currentState="rejected"
              />
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This member hasn't completed their profile yet.
          </p>
        </CardContent>
      )}
    </Card>
  )
}