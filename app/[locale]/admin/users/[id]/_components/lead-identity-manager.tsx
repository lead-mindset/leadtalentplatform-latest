'use client'

import { useMemo, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { issueLeadIdentity, revokeLeadIdentity, setPrimaryLeadIdentity } from '@/lib/actions/admin/identities'
import type { ChapterRow, IdentityType, LeadIdentityRow } from '@/lib/types'
import { ShieldCheck, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type PublicIdentityType = Exclude<IdentityType, 'admin'>

type IdentityManagerChapter = Pick<ChapterRow, 'id' | 'name' | 'university'>

type Props = {
  userId: string
  userRole: string
  identities: LeadIdentityRow[]
  chapters: IdentityManagerChapter[]
  defaultChapterId?: string | null
}

const IDENTITY_TYPES: Array<{ value: PublicIdentityType; label: string; requiresChapter: boolean }> = [
  { value: 'founder', label: 'Founder', requiresChapter: false },
  { value: 'staff', label: 'Staff', requiresChapter: false },
  { value: 'chapter_member', label: 'Chapter member', requiresChapter: true },
  { value: 'chapter_editor', label: 'Chapter editor', requiresChapter: true },
  { value: 'alumni', label: 'Alumni', requiresChapter: true },
]

function formatIdentityType(identityType: IdentityType) {
  return identityType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function LeadIdentityManager({
  userId,
  userRole,
  identities,
  chapters,
  defaultChapterId,
}: Props) {
  const [identityType, setIdentityType] = useState<PublicIdentityType>('chapter_member')
  const [chapterId, setChapterId] = useState(defaultChapterId ?? chapters[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()

  const selectedIdentityType = useMemo(
    () => IDENTITY_TYPES.find((item) => item.value === identityType) ?? IDENTITY_TYPES[0],
    [identityType]
  )

  const chapterById = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.id, chapter])),
    [chapters]
  )

  const issueIdentity = () => {
    startTransition(async () => {
      const result = await issueLeadIdentity({
        userId,
        identityType,
        chapterId: selectedIdentityType.requiresChapter ? chapterId : null,
        makePrimary: identities.length === 0,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('LEAD identity issued.')
    })
  }

  const setPrimary = (identityId: string) => {
    startTransition(async () => {
      const result = await setPrimaryLeadIdentity({ userId, identityId })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Primary identity updated.')
    })
  }

  const revoke = (identityId: string) => {
    startTransition(async () => {
      const result = await revokeLeadIdentity({ userId, identityId })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('LEAD identity revoked.')
    })
  }

  const canIssue = !selectedIdentityType.requiresChapter || chapterId.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          LEAD Identities
        </CardTitle>
        <CardDescription>
          App role controls access. LEAD identity controls public status and display.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Authorization role</span>
          <Badge variant="outline">{userRole}</Badge>
        </div>

        <Separator />

        {identities.length > 0 ? (
          <div className="space-y-3">
            {identities.map((identity) => {
              const chapter = identity.chapter_id ? chapterById.get(identity.chapter_id) : null

              return (
                <div
                  key={identity.id}
                  className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{formatIdentityType(identity.identity_type)}</span>
                      {identity.is_primary && (
                        <Badge className="gap-1" variant="default">
                          <Star className="h-3 w-3" />
                          Primary
                        </Badge>
                      )}
                      <Badge variant="secondary">{identity.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {chapter
                        ? `${chapter.name} - ${chapter.university}`
                        : 'Global LEAD identity'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!identity.is_primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setPrimary(identity.id)}
                      >
                        <Star className="h-4 w-4" />
                        Set primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => revoke(identity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No active LEAD identities have been issued for this user.
          </div>
        )}

        <Separator />

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Identity type</div>
            <Select
              value={identityType}
              onValueChange={(value) => setIdentityType(value as PublicIdentityType)}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IDENTITY_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Chapter scope</div>
            <Select
              value={chapterId}
              onValueChange={setChapterId}
              disabled={isPending || !selectedIdentityType.requiresChapter || chapters.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button disabled={isPending || !canIssue} onClick={issueIdentity}>
            <ShieldCheck className="h-4 w-4" />
            Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

