'use client'

import { BoardGuideDialog } from '@/components/board-guide-dialog'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import type { ChapterRoleLevel } from '@/lib/services/chapter-permission.service'

export function ChapterHeader({
  roleLevel,
  title,
  subtitle,
  children,
}: {
  roleLevel: ChapterRoleLevel | null
  title: string
  subtitle: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {roleLevel && (
          <BoardGuideDialog roleLevel={roleLevel}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
              <Icons.HelpCircle className="h-5 w-5" />
            </Button>
          </BoardGuideDialog>
        )}
      </div>
      <p className="max-w-2xl text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  )
}
