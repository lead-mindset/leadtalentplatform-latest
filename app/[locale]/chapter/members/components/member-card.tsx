import type { MemberWithProfile } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Icons } from '@/components/ui/icons'
import { MemberActionButtons } from "./member-actions"

export default function MemberCard({
  member,
  selected = false,
  onSelectChange,
  showSelector = false,
}: {
  member: MemberWithProfile
  selected?: boolean
  onSelectChange?: (checked: boolean) => void
  showSelector?: boolean
}) {
  const profile = member.person_profile
  const membership = member.chapter_membership

  const approval_status = membership?.status
  const isPending  = Boolean(profile) && approval_status === 'pending'
  const isApproved = approval_status === 'approved'
  const isRejected = approval_status === 'rejected'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {showSelector && (
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => onSelectChange?.(checked === true)}
                />
                Select for bulk approve
              </label>
            )}
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
            {!profile && (
              <Badge variant="outline" className="text-muted-foreground">
                Incomplete
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {profile ? (
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm">
            {member.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {member.phone}
              </div>
            )}

            {profile.major_or_interest && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                {profile.major_or_interest}
              </div>
            )}

            {profile.graduation_year && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Class of {profile.graduation_year}
              </div>
            )}

            {profile.linkedin_url && (
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-info" />
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info underline hover:underline text-sm"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.skills.map((skill: string) => (
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
                userName={member.name ?? member.email}
                currentState="pending"
              />
            </div>
          )}

          {isApproved && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="h-4 w-4 text-success" />
                Approved on {new Date(profile.updated_at).toLocaleDateString()}
              </div>
              {membership?.member_id && (
                <div className="flex items-center gap-2 text-sm">
                  <Icons.IdCard className="h-4 w-4 text-primary" />
                  <span className="font-medium text-muted-foreground">Member ID:</span>{' '}
                  <code className="px-2 py-1 bg-primary/5 border border-primary/10 rounded text-sm font-mono text-primary">
                    {membership.member_id}
                  </code>
                </div>
              )}
              {membership?.position && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Position: {membership.position.replaceAll('_', ' ')}
                </div>
              )}
              <MemberActionButtons
                userId={member.id}
                userName={member.name ?? member.email}
                currentState="approved"
              />
            </div>
          )}

          {isRejected && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-destructive" />
                Rejected on {new Date(profile.updated_at).toLocaleDateString()}
              </div>
              <MemberActionButtons
                userId={member.id}
                userName={member.name ?? member.email}
                currentState="rejected"
              />
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This member hasn&apos;t completed their profile yet.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
