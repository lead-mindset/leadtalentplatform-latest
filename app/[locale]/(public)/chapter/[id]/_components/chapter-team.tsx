'use client'

import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicChapterProfileMember } from '@/lib/services/chapter-profile.service'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getMemberContext(member: PublicChapterProfileMember) {
  return member.chapter_position || member.major_or_interest || 'Chapter community'
}

export function ChapterTeam({ members }: { members: PublicChapterProfileMember[] }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Chapter community</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A student-led community built around leadership, STEM, and opportunity access.
        </p>
      </div>

      {members.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {members.slice(0, 8).map((member) => (
            <Card key={member.user_id} className="rounded-lg">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border bg-muted text-sm font-semibold">
                  {getInitials(member.name)}
                </div>
                <p className="line-clamp-1 text-sm font-medium">{member.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {getMemberContext(member)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-lg">
          <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <Users className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Community preview coming soon</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              This chapter is preparing its public community preview. You can still explore events or express interest in joining.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
