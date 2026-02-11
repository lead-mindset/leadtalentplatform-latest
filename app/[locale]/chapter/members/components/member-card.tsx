import type { MemberWithProfile } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Clock,
  UserCheck,
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
      <UserCheck className="h-4 w-4 text-green-600" />
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
