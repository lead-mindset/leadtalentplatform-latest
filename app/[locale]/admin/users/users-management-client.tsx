'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  bulkUpdateUsers,
  deactivateUser,
  exportUsersCSV,
  reactivateUser,
  updateUserRole,
  type AdminUserListItem,
  type ProfileStatusFilter,
} from '@/lib/actions/admin/users'
import { getRoleColor } from '@/lib/options'
import type { Role } from '@/lib/types'

type ChapterOption = { id: string; name: string }

type UsersManagementClientProps = {
  users: AdminUserListItem[]
  total: number
  page: number
  pageSize: 25 | 50 | 100
  roleFilters: Role[]
  chapterFilters: string[]
  approvalFilters: ProfileStatusFilter[]
  search: string
  chapterOptions: ChapterOption[]
}

const ROLE_OPTIONS: Role[] = ['admin', 'editor', 'member', 'recruiter']
const PROFILE_OPTIONS: ProfileStatusFilter[] = ['complete', 'pending_approval', 'incomplete', 'no_profile']

function formatProfileStatus(status: ProfileStatusFilter): string {
  if (status === 'pending_approval') return 'Pending approval'
  if (status === 'no_profile') return 'No profile'
  return status[0].toUpperCase() + status.slice(1)
}

function downloadCsv(content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function UsersManagementClient({
  users,
  total,
  page,
  pageSize,
  roleFilters,
  chapterFilters,
  approvalFilters,
  search,
  chapterOptions,
}: UsersManagementClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchInput, setSearchInput] = useState(search)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmState, setConfirmState] = useState<{
    title: string
    description: string
    action: () => Promise<void>
  } | null>(null)

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === search) return
      const params = new URLSearchParams(searchParams.toString())
      if (searchInput.trim()) params.set('search', searchInput.trim())
      else params.delete('search')
      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(handle)
  }, [searchInput, search, pathname, router, searchParams])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const allVisibleSelected = users.length > 0 && users.every((user) => selectedIds.includes(user.id))

  const selectedLabel = useMemo(
    () => `${selectedIds.length} selected`,
    [selectedIds.length]
  )

  const updateMultiParam = (key: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    values.forEach((value) => params.append(key, value))
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const updateSingleParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    if (key !== 'page') params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const runAction = (action: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    startTransition(async () => {
      const result = await action()
      if (!result.success) {
        toast.error(result.error ?? 'Action failed.')
        return
      }
      toast.success(successMessage)
      setSelectedIds([])
      router.refresh()
    })
  }

  const handleExport = () => {
    startTransition(async () => {
      const csv = await exportUsersCSV({
        search,
        roles: roleFilters,
        chapterIds: chapterFilters,
        approvalStatuses: approvalFilters,
      })
      downloadCsv(csv)
      toast.success('CSV exported.')
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search by name or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Roles ({roleFilters.length || 'all'})</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter roles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ROLE_OPTIONS.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role}
                    checked={roleFilters.includes(role)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...roleFilters, role]
                        : roleFilters.filter((current) => current !== role)
                      updateMultiParam('role', next)
                    }}
                  >
                    {role}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Chapters ({chapterFilters.length || 'all'})</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter chapters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {chapterOptions.map((chapter) => (
                  <DropdownMenuCheckboxItem
                    key={chapter.id}
                    checked={chapterFilters.includes(chapter.id)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...chapterFilters, chapter.id]
                        : chapterFilters.filter((id) => id !== chapter.id)
                      updateMultiParam('chapter', next)
                    }}
                  >
                    {chapter.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Profile ({approvalFilters.length || 'all'})</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Profile status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {PROFILE_OPTIONS.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={approvalFilters.includes(status)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...approvalFilters, status]
                        : approvalFilters.filter((current) => current !== status)
                      updateMultiParam('approval', next)
                    }}
                  >
                    {formatProfileStatus(status)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.delete('search')
                params.delete('role')
                params.delete('chapter')
                params.delete('approval')
                params.set('page', '1')
                router.push(`${pathname}?${params.toString()}`)
              }}
            >
              Reset filters
            </Button>
            <Button variant="secondary" onClick={handleExport} disabled={isPending}>
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{selectedLabel}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmState({
                    title: 'Deactivate selected users?',
                    description: 'Selected users will be marked as deactivated.',
                    action: async () => {
                      runAction(
                        () => bulkUpdateUsers(selectedIds, { type: 'deactivate' }),
                        'Users deactivated.'
                      )
                    },
                  })
                }
              >
                Deactivate
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmState({
                    title: 'Reactivate selected users?',
                    description: 'Selected users will regain access.',
                    action: async () => {
                      runAction(
                        () => bulkUpdateUsers(selectedIds, { type: 'reactivate' }),
                        'Users reactivated.'
                      )
                    },
                  })
                }
              >
                Reactivate
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Change role</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {ROLE_OPTIONS.map((role) => (
                    <Button
                      key={role}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() =>
                        setConfirmState({
                          title: `Change selected users to ${role}?`,
                          description: 'This updates the role for all selected users.',
                          action: async () => {
                            runAction(
                              () => bulkUpdateUsers(selectedIds, { type: 'change_role', role }),
                              'Roles updated.'
                            )
                          },
                        })
                      }
                    >
                      {role}
                    </Button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) =>
                        setSelectedIds(checked ? users.map((user) => user.id) : [])
                      }
                    />
                  </th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Chapter</th>
                  <th className="text-left p-2">Join Date</th>
                  <th className="text-left p-2">Profile Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b align-top">
                    <td className="p-2">
                      <Checkbox
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={(checked) =>
                          setSelectedIds((prev) =>
                            checked ? [...prev, user.id] : prev.filter((id) => id !== user.id)
                          )
                        }
                      />
                    </td>
                    <td className="p-2 font-medium">
                      <Link className="hover:underline" href={`/admin/users/${user.id}`}>
                        {user.name || 'No name'}
                      </Link>
                    </td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                      {user.deactivatedAt && (
                        <Badge variant="outline" className="ml-2">
                          Deactivated
                        </Badge>
                      )}
                    </td>
                    <td className="p-2">{user.chapterName ?? '—'}</td>
                    <td className="p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-2">{formatProfileStatus(user.profileStatus)}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">Role</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ROLE_OPTIONS.map((role) => (
                              <Button
                                key={role}
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() =>
                                  setConfirmState({
                                    title: `Change role to ${role}?`,
                                    description: `${user.email} will become ${role}.`,
                                    action: async () => {
                                      runAction(
                                        () => updateUserRole(user.id, role),
                                        'Role updated.'
                                      )
                                    },
                                  })
                                }
                              >
                                {role}
                              </Button>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {user.deactivatedAt ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setConfirmState({
                                title: 'Reactivate this user?',
                                description: `${user.email} will regain access.`,
                                action: async () => {
                                  runAction(() => reactivateUser(user.id), 'User reactivated.')
                                },
                              })
                            }
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setConfirmState({
                                title: 'Deactivate this user?',
                                description: `${user.email} will no longer be active.`,
                                action: async () => {
                                  runAction(() => deactivateUser(user.id), 'User deactivated.')
                                },
                              })
                            }
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No users found.</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {total} users • page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateSingleParam('page', String(page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateSingleParam('page', String(page + 1))}
              >
                Next
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Page size: {pageSize}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[25, 50, 100].map((size) => (
                    <Button
                      key={size}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => updateSingleParam('pageSize', String(size))}
                    >
                      {size}
                    </Button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(confirmState)} onOpenChange={(open) => !open && setConfirmState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmState?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => {
                const action = confirmState?.action
                setConfirmState(null)
                if (action) void action()
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
