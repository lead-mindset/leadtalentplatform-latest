'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  ADMIN_CHAPTER_ROLE_OPTIONS,
  CHAPTER_FUNCTIONAL_AREA_LABELS,
  CHAPTER_FUNCTIONAL_AREA_OPTIONS,
  CHAPTER_ROLE_LEVEL_LABELS,
} from '@/lib/chapter-role-options'
import type { ActiveChapterRoleAssignment, ChapterRow } from '@/lib/types'
import type {
  AssignableChapterRoleLevel,
  ChapterFunctionalArea,
} from '@/lib/services/chapter-role-assignment.service'
import {
  assignAdminChapterRole,
  deactivateChapterRoleAssignment,
} from '@/lib/actions/chapter/role-assignments'

type Props = {
  userId: string
  userName: string
  chapters: ChapterRow[]
  defaultChapterId?: string | null
  assignment: ActiveChapterRoleAssignment | null
}

const DEFAULT_ROLE: AssignableChapterRoleLevel = 'president'
const DEFAULT_AREA: ChapterFunctionalArea = 'general_leadership'

export function AdminChapterRoleCorrectionPanel({
  userId,
  userName,
  chapters,
  defaultChapterId,
  assignment,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [chapterId, setChapterId] = useState(defaultChapterId ?? chapters[0]?.id ?? '')
  const [roleLevel, setRoleLevel] = useState<AssignableChapterRoleLevel>(
    (assignment?.role_level as AssignableChapterRoleLevel | undefined) ?? DEFAULT_ROLE
  )
  const [functionalArea, setFunctionalArea] = useState<ChapterFunctionalArea>(
    (assignment?.functional_area as ChapterFunctionalArea | undefined) ?? DEFAULT_AREA
  )
  const [displayTitle, setDisplayTitle] = useState(assignment?.display_title ?? '')
  const [removeReason, setRemoveReason] = useState('')

  function submitAssignment() {
    startTransition(async () => {
      const result = await assignAdminChapterRole({
        targetUserId: userId,
        chapterId,
        roleLevel,
        functionalArea,
        displayTitle,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`Rol de capitulo actualizado para ${userName}`)
      router.refresh()
    })
  }

  function submitRemoval() {
    const reason = removeReason.trim()
    if (!assignment?.id || !reason) {
      toast.error('Ingresa un motivo para retirar el rol')
      return
    }

    startTransition(async () => {
      const result = await deactivateChapterRoleAssignment({
        roleAssignmentId: assignment.id,
        reason,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Rol de capitulo retirado')
      setRemoveReason('')
      router.refresh()
    })
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Chapter Role Correction
        </CardTitle>
        <CardDescription>
          Admin-only path for president, vice president, and mapping corrections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignment ? (
          <div className="rounded-lg border bg-background p-3 text-sm">
            <p className="font-medium">{assignment.display_title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {CHAPTER_ROLE_LEVEL_LABELS[assignment.role_level as keyof typeof CHAPTER_ROLE_LEVEL_LABELS] ?? assignment.role_level}
              {' / '}
              {CHAPTER_FUNCTIONAL_AREA_LABELS[assignment.functional_area as ChapterFunctionalArea] ?? assignment.functional_area}
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Chapter</Label>
          <Select value={chapterId} onValueChange={setChapterId}>
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

        <div className="space-y-2">
          <Label>Role level</Label>
          <Select value={roleLevel} onValueChange={(value) => setRoleLevel(value as AssignableChapterRoleLevel)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_CHAPTER_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Functional area</Label>
          <Select value={functionalArea} onValueChange={(value) => setFunctionalArea(value as ChapterFunctionalArea)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAPTER_FUNCTIONAL_AREA_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Display title"
          value={displayTitle}
          onChange={(event) => setDisplayTitle(event.target.value)}
          placeholder="Presidenta, Vicepresidente, Directora de Marketing"
          helperText="Admin can correct protected leadership roles here."
        />

        <Button
          className="w-full"
          onClick={submitAssignment}
          disabled={isPending || !chapterId || displayTitle.trim().length < 2}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          Save chapter role
        </Button>

        {assignment ? (
          <div className="space-y-2 border-t pt-4">
            <Textarea
              value={removeReason}
              onChange={(event) => setRemoveReason(event.target.value)}
              placeholder="Removal reason for audit log"
              rows={3}
            />
            <Button
              variant="destructive"
              className="w-full"
              onClick={submitRemoval}
              disabled={isPending || removeReason.trim().length === 0}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Remove active role
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
