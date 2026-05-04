'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertCircle, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserRole } from '@/lib/actions/admin/users'
import { getRoleColor } from '@/lib/options'
import type { Role } from '@/lib/types'

const ROLE_OPTIONS: Role[] = ['admin', 'editor', 'member', 'recruiter']

type Props = {
  userId: string
  userEmail: string
  currentRole: Role
  membershipStatus?: string | null
  membershipPosition?: string | null
  chapterName?: string | null
}

export function RoleManagementPanel({
  userId,
  userEmail,
  currentRole,
  membershipStatus,
  membershipPosition,
  chapterName,
}: Props) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isRoleChanged = selectedRole !== currentRole
  const editorEligible = membershipStatus === 'approved'
  const editorWarning = selectedRole === 'editor' && !editorEligible

  const helperText = useMemo(() => {
    if (selectedRole === 'editor') {
      return editorEligible
        ? `Editor role is eligible because this user has approved membership${chapterName ? ` in ${chapterName}` : ''}.`
        : 'Editor role requires approved chapter membership. The service will block this change until that exists.'
    }

    if (selectedRole === 'admin') {
      return 'Admin is an authorization role. It is not a public LEAD identity.'
    }

    if (selectedRole === 'recruiter') {
      return 'Recruiter access should still be managed through company access records.'
    }

    return 'Member keeps standard authenticated participant access.'
  }, [chapterName, editorEligible, selectedRole])

  function confirmRoleChange() {
    startTransition(async () => {
      const result = await updateUserRole(userId, selectedRole)

      if (!result.success) {
        toast.error(result.error)
        setConfirmOpen(false)
        return
      }

      toast.success('Role updated.')
      setConfirmOpen(false)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          Account Role
        </CardTitle>
        <CardDescription>
          Role controls application authorization. LEAD identity controls public status and display.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Current role</span>
          <Badge className={getRoleColor(currentRole)} variant="outline">
            {currentRole}
          </Badge>
          {membershipPosition && (
            <Badge variant="secondary">{membershipPosition}</Badge>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Change role</div>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as Role)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={!isRoleChanged || isPending} onClick={() => setConfirmOpen(true)}>
            Update role
          </Button>
        </div>

        <div className={`flex gap-2 rounded-lg border p-3 text-sm ${editorWarning ? 'bg-warning/10' : 'bg-muted/40'}`}>
          <AlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${editorWarning ? 'text-warning' : 'text-muted-foreground'}`} />
          <p className="text-muted-foreground">{helperText}</p>
        </div>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change role to {selectedRole}?</AlertDialogTitle>
              <AlertDialogDescription>
                {userEmail} will receive {selectedRole} authorization. Editor changes remain subject to approved chapter membership checks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRoleChange} disabled={isPending}>
                Confirm role change
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
