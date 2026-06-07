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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
} from '@/lib/actions/admin/users'
import type {
  AdminUserListItem,
  ProfileStatusFilter,
} from '@/lib/services/admin.service'
import { getRoleColor } from '@/lib/options'
import type { Role } from '@/lib/types'
import { formatLeadDate } from '@/lib/utils/date-format'

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
  loadError?: string | null
  chapterOptions: ChapterOption[]
}

const ROLE_OPTIONS: Role[] = ['admin', 'editor', 'member', 'recruiter']
const PROFILE_OPTIONS: ProfileStatusFilter[] = ['complete', 'pending_approval', 'incomplete', 'no_profile']

function formatProfileStatus(status: ProfileStatusFilter): string {
  if (status === 'pending_approval') return 'Pendiente de aprobación'
  if (status === 'no_profile') return 'Sin perfil'
  if (status === 'complete') return 'Completo'
  return 'Incompleto'
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
  loadError = null,
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
    () => `${selectedIds.length} seleccionados`,
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
        toast.error(result.error ?? 'No se pudo completar la acción.')
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
        chapter_ids: chapterFilters,
        chapter_statuses: approvalFilters,
      })
      downloadCsv(csv)
      toast.success('CSV exportado.')
    })
  }

  const toggleUserSelection = (userId: string, checked: boolean | string) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, userId])) : prev.filter((id) => id !== userId)
    )
  }

  const renderUserActions = (user: AdminUserListItem, compact = false) => (
    <div className={compact ? 'grid gap-2 sm:grid-cols-3' : 'flex flex-wrap gap-2'}>
      <Button asChild variant="outline" size="sm" className={compact ? 'w-full' : undefined}>
        <Link href={`/admin/users/${user.id}`}>Ver perfil</Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={compact ? 'w-full' : undefined}>Rol</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ROLE_OPTIONS.map((role) => (
            <DropdownMenuItem
              key={role}
              onClick={() =>
                setConfirmState({
                  title: `¿Cambiar rol a ${role}?`,
                  description: `${user.email} cambiará a ${role}.`,
                  action: async () => {
                    runAction(
                      () => updateUserRole(user.id, role),
                      'Rol actualizado.'
                    )
                  },
                })
              }
            >
              {role}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {user.deactivated_at ? (
        <Button
          variant="outline"
          size="sm"
          className={compact ? 'w-full' : undefined}
          onClick={() =>
            setConfirmState({
              title: '¿Reactivar este usuario?',
              description: `${user.email} recuperará acceso.`,
              action: async () => {
                runAction(() => reactivateUser(user.id), 'Usuario reactivado.')
              },
            })
          }
        >
          Reactivar
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={compact ? 'w-full' : undefined}
          onClick={() =>
            setConfirmState({
              title: '¿Desactivar este usuario?',
              description: `${user.email} dejará de estar activo.`,
              action: async () => {
                runAction(() => deactivateUser(user.id), 'Usuario desactivado.')
              },
            })
          }
        >
          Desactivar
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input
              aria-label="Buscar usuarios por nombre o correo"
              placeholder="Buscar por nombre o correo"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Roles ({roleFilters.length || 'todos'})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filtrar roles</DropdownMenuLabel>
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
                  <Button variant="outline" className="w-full justify-between">
                    Capítulos ({chapterFilters.length || 'todos'})
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Filtrar capítulos</DropdownMenuLabel>
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
                <Button variant="outline" className="w-full justify-between">
                  Perfil ({approvalFilters.length || 'todos'})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Estado de perfil</DropdownMenuLabel>
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
              Limpiar filtros
            </Button>
            <Button variant="secondary" onClick={handleExport} disabled={isPending}>
              Exportar CSV
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
                    title: 'Desactivar usuarios seleccionados?',
                    description: 'Los usuarios seleccionados quedaran marcados como desactivados.',
                    action: async () => {
                      runAction(
                        () => bulkUpdateUsers(selectedIds, { type: 'deactivate' }),
                        'Usuarios desactivados.'
                      )
                    },
                  })
                }
              >
                Desactivar
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmState({
                    title: 'Reactivar usuarios seleccionados?',
                    description: 'Los usuarios seleccionados recuperaran acceso.',
                    action: async () => {
                      runAction(
                        () => bulkUpdateUsers(selectedIds, { type: 'reactivate' }),
                        'Usuarios reactivados.'
                      )
                    },
                  })
                }
              >
                Reactivar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Cambiar rol</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {ROLE_OPTIONS.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() =>
                        setConfirmState({
                          title: `Cambiar usuarios seleccionados a ${role}?`,
                          description: 'Esto actualiza el rol de todos los usuarios seleccionados.',
                          action: async () => {
                            runAction(
                              () => bulkUpdateUsers(selectedIds, { type: 'change_role', role }),
                              'Roles actualizados.'
                            )
                          },
                        })
                      }
                    >
                      {role}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-3 md:hidden">
            {users.map((user) => {
              const selected = selectedIds.includes(user.id)

              return (
                <div
                  key={user.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      aria-label={`Seleccionar ${user.name || user.email}`}
                      checked={selected}
                      onCheckedChange={(checked) => toggleUserSelection(user.id, checked)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="space-y-1">
                        <Link
                          className="block break-words text-base font-semibold text-foreground hover:underline"
                          href={`/admin/users/${user.id}`}
                        >
                          {user.name || 'Sin nombre'}
                        </Link>
                        <p className="break-all text-sm text-muted-foreground">{user.email}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                        <Badge variant="outline">{formatProfileStatus(user.profile_status)}</Badge>
                        {user.deactivated_at ? (
                          <Badge variant="outline">Desactivado</Badge>
                        ) : null}
                      </div>

                      <dl className="grid gap-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <dt className="text-muted-foreground">Capítulo</dt>
                          <dd className="text-right font-medium">{user.chapter_name ?? 'Sin capítulo'}</dd>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <dt className="text-muted-foreground">Registro</dt>
                          <dd className="text-right font-medium">{formatLeadDate(user.created_at)}</dd>
                        </div>
                      </dl>

                      {renderUserActions(user, true)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left p-2">
                    <Checkbox
                      aria-label="Seleccionar todos los usuarios visibles"
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) =>
                        setSelectedIds(checked ? users.map((user) => user.id) : [])
                      }
                    />
                </TableHead>
                <TableHead className="text-left p-2">Nombre</TableHead>
                <TableHead className="text-left p-2">Email</TableHead>
                <TableHead className="text-left p-2">Rol</TableHead>
                <TableHead className="text-left p-2">Capítulo</TableHead>
                <TableHead className="text-left p-2">Fecha de registro</TableHead>
                <TableHead className="text-left p-2">Estado de perfil</TableHead>
                <TableHead className="text-left p-2">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="align-top">
                    <TableCell className="p-2">
                      <Checkbox
                        aria-label={`Seleccionar ${user.name || user.email}`}
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={(checked) => toggleUserSelection(user.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="p-2 font-medium">
                      <Link className="hover:underline" href={`/admin/users/${user.id}`}>
                        {user.name || 'Sin nombre'}
                      </Link>
                    </TableCell>
                    <TableCell className="p-2">{user.email}</TableCell>
                    <TableCell className="p-2">
                      <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                      {user.deactivated_at && (
                        <Badge variant="outline" className="ml-2">
                          Desactivado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="p-2">{user.chapter_name ?? '—'}</TableCell>
                    <TableCell className="p-2">{formatLeadDate(user.created_at)}</TableCell>
                    <TableCell className="p-2">{formatProfileStatus(user.profile_status)}</TableCell>
                    <TableCell className="p-2">
                      {renderUserActions(user)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          </div>

          {loadError ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
            >
              {loadError}
            </div>
          ) : users.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No se encontraron usuarios con los filtros actuales.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {total} usuarios - página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateSingleParam('page', String(page - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateSingleParam('page', String(page + 1))}
              >
                Siguiente
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Filas: {pageSize}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[25, 50, 100].map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => updateSingleParam('pageSize', String(size))}
                    >
                      {size}
                    </DropdownMenuItem>
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
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => {
                const action = confirmState?.action
                setConfirmState(null)
                if (action) void action()
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
