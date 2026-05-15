import { requireChapterMember } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import type { MemberWithProfile } from '@/lib/types'
import { getChapterMembers, getMemberStats } from '@/lib/actions/chapter/get-data'
import { MembersList } from './components/members-list'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MainContainer } from '@/components/global/main-container'
import { MembersTabs, type MemberStatusCounts } from './components/member-tabs'
import { PageHeader } from '@/components/ui/page-header'

export type MemberFilterStatus = 'pending' | 'active' | 'rejected' | 'alumni'

function alumniCount(members: MemberWithProfile[]) {
  return members.filter(member => member.chapter_membership?.status === 'alumni').length
}

export function filterMembers(members: MemberWithProfile[], status: MemberFilterStatus): MemberWithProfile[] {
  switch (status) {
    case 'pending':
      return members.filter(
        member => member.person_profile && member.chapter_membership?.status === 'pending'
      )
    case 'active':
      return members.filter(
        member => member.chapter_membership?.status === 'approved'
      )
    case 'rejected':
      return members.filter(
        member => member.chapter_membership?.status === 'rejected'
      )
    case 'alumni':
      return members.filter(
        member => member.chapter_membership?.status === 'alumni'
      )
  }
}

function SummaryBlock({
  label,
  value,
  helper,
  variant = 'default',
}: {
  label: string
  value: number
  helper: string
  variant?: 'default' | 'warning' | 'success' | 'destructive' | 'neutral'
}) {
  const valueClass =
    variant === 'warning'
      ? 'text-warning'
      : variant === 'success'
      ? 'text-success'
      : variant === 'destructive'
      ? 'text-destructive'
      : variant === 'neutral'
      ? 'text-muted-foreground'
      : 'text-foreground'

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

export default async function ChapterMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: MemberFilterStatus }>
}) {
  const { status } = await searchParams
  const { supabase, chapter_id } = await requireChapterMember()

  const { data: chapter } = await supabase
    .from('chapter')
    .select('id, name, university')
    .eq('id', chapter_id)
    .maybeSingle()

  if (!chapter) {
    return (
      <MainContainer className="w-full max-w-full py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <Icons.AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <h1 className="text-xl font-semibold">Sin chapter asignado</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              No tienes un chapter asignado. Contacta a una persona administradora.
            </p>
          </CardContent>
        </Card>
      </MainContainer>
    )
  }

  const allMembers = await getChapterMembers(chapter_id)
  const stats = getMemberStats(allMembers)
  const alumni = alumniCount(allMembers)
  const counts: MemberStatusCounts = {
    pending: stats.pending,
    active: stats.approved,
    rejected: stats.rejected,
    alumni,
  }
  const validStatuses: MemberFilterStatus[] = ['pending', 'active', 'rejected', 'alumni']
  const defaultStatus: MemberFilterStatus = stats.pending > 0 ? 'pending' : 'active'
  const safeStatus: MemberFilterStatus = status && validStatuses.includes(status) ? status : defaultStatus
  const displayMembers = filterMembers(allMembers, safeStatus)

  return (
    <MainContainer className="w-full max-w-full py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Resumen', href: '/chapter' },
          { label: 'Miembros' },
        ]}
      />

      <PageHeader
        eyebrow="Herramientas del chapter"
        title="Miembros del chapter"
        badge={<Badge variant="outline">{chapter.name}</Badge>}
        description={`Revisa postulantes pendientes y gestiona el estado de membresia para ${chapter.university}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryBlock
          label="Pendientes"
          value={stats.pending}
          helper="Necesitan revision"
          variant="warning"
        />
        <SummaryBlock
          label="Aprobados"
          value={stats.approved}
          helper="Miembros activos del chapter"
          variant="success"
        />
        <SummaryBlock
          label="Rechazados"
          value={stats.rejected}
          helper="Postulaciones rechazadas"
          variant="destructive"
        />
        <SummaryBlock
          label="Alumni"
          value={alumni}
          helper="Exmiembros"
          variant="neutral"
        />
        <SummaryBlock
          label="Total"
          value={stats.total}
          helper="Todos los registros"
        />
      </div>

      <div className="space-y-4">
        <MembersTabs currentStatus={safeStatus} counts={counts} />

        {displayMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icons.Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">No hay miembros en esta vista</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Cambia el filtro de estado para revisar otros registros de membresia.
              </p>
            </CardContent>
          </Card>
        ) : (
          <MembersList members={displayMembers} status={safeStatus} />
        )}
      </div>
    </MainContainer>
  )
}
