'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Icons } from '@/components/ui/icons'
import {
  FUNDING_SOURCE_KEYS,
  type FundingAdminRequestContext,
  type FundingSourceKey,
} from '@/lib/services/funding.service'
import {
  FUNDING_SOURCE_LABELS,
  formatFundingCurrency,
} from '@/lib/funding-display'
import {
  closeAdminFundingRequest,
  reviewFundingRequest,
  setFundingSource as saveFundingSource,
} from '@/lib/actions/funding/admin'

const NO_SOURCE_VALUE = 'no-source'

type ReviewDecision = 'approve_full' | 'approve_partial' | 'request_changes' | 'reject'

export function AdminFundingReviewPanel({
  context,
}: {
  context: FundingAdminRequestContext
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const request = context.request
  const [approvedAmount, setApprovedAmount] = useState(
    request.approved_amount == null ? String(request.requested_amount) : String(request.approved_amount)
  )
  const [note, setNote] = useState(request.admin_decision_note ?? '')
  const [source, setSource] = useState<FundingSourceKey | ''>(
    (request.internal_funding_source as FundingSourceKey | null) ?? ''
  )
  const [sourceNote, setSourceNote] = useState(request.internal_funding_source_note ?? '')
  const [closureNote, setClosureNote] = useState(request.closure_note ?? '')
  const canReview = request.status === 'submitted'
  const canClose = request.status === 'approved' || request.status === 'receipts_due'

  function runReview(decision: ReviewDecision) {
    startTransition(() => {
      void (async () => {
        const result = await reviewFundingRequest({
          requestId: request.id,
          decision,
          approvedAmount: decision === 'approve_partial' ? Number(approvedAmount) : null,
          note: note || null,
          fundingSource: source || null,
        })

        if (!result.success) {
          toast.error(result.error)
          return
        }

        toast.success('Decision guardada.')
        router.refresh()
      })()
    })
  }

  function runSourceUpdate() {
    startTransition(() => {
      void (async () => {
        const result = await saveFundingSource({
          requestId: request.id,
          fundingSource: source || null,
          fundingSourceNote: sourceNote || null,
        })

        if (!result.success) {
          toast.error(result.error)
          return
        }

        toast.success('Fuente interna actualizada.')
        router.refresh()
      })()
    })
  }

  function runClose() {
    startTransition(() => {
      void (async () => {
        const result = await closeAdminFundingRequest({
          requestId: request.id,
          closureNote: closureNote || null,
        })

        if (!result.success) {
          toast.error(result.error)
          return
        }

        toast.success('Solicitud cerrada.')
        router.refresh()
      })()
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Decision de admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`approved-${request.id}`}>Monto aprobado</Label>
              <Input
                id={`approved-${request.id}`}
                inputMode="decimal"
                value={approvedAmount}
                onChange={(event) => setApprovedAmount(event.target.value)}
                disabled={!canReview || isPending}
              />
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Solicitado</p>
              <p className="text-base font-semibold">
                {formatFundingCurrency(request.requested_amount, request.currency)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`decision-note-${request.id}`}>Nota de decision</Label>
            <Textarea
              id={`decision-note-${request.id}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              disabled={!canReview || isPending}
              placeholder="Obligatoria para aprobacion parcial, cambios o rechazo."
            />
          </div>

          {canReview ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" onClick={() => runReview('approve_full')} disabled={isPending}>
                {isPending ? <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Aprobar completo
              </Button>
              <Button type="button" variant="secondary" onClick={() => runReview('approve_partial')} disabled={isPending}>
                Aprobar parcial
              </Button>
              <Button type="button" variant="outline" onClick={() => runReview('request_changes')} disabled={isPending}>
                Pedir cambios
              </Button>
              <Button type="button" variant="destructive" onClick={() => runReview('reject')} disabled={isPending}>
                Rechazar
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Las decisiones solo estan disponibles para solicitudes enviadas a revision.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuente interna</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`source-${request.id}`}>Fuente</Label>
            <Select
              value={source || NO_SOURCE_VALUE}
              onValueChange={(value) => setSource(value === NO_SOURCE_VALUE ? '' : value as FundingSourceKey)}
              disabled={isPending}
            >
              <SelectTrigger id={`source-${request.id}`} className="w-full">
                <SelectValue placeholder="Sin fuente asignada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SOURCE_VALUE}>Sin fuente asignada</SelectItem>
                {FUNDING_SOURCE_KEYS.map(key => (
                  <SelectItem key={key} value={key}>
                    {FUNDING_SOURCE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`source-note-${request.id}`}>Nota interna</Label>
            <Textarea
              id={`source-note-${request.id}`}
              value={sourceNote}
              onChange={(event) => setSourceNote(event.target.value)}
              rows={2}
              disabled={isPending}
            />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={runSourceUpdate} disabled={isPending}>
            Guardar fuente
          </Button>
        </CardContent>
      </Card>

      {canClose && (
        <Card>
          <CardHeader>
            <CardTitle>Cierre y regularizacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`closure-note-${request.id}`}>Nota de cierre</Label>
              <Textarea
                id={`closure-note-${request.id}`}
                value={closureNote}
                onChange={(event) => setClosureNote(event.target.value)}
                rows={3}
                disabled={isPending}
                placeholder="Usa esto para excepciones justificadas o regularizacion manual."
              />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={runClose} disabled={isPending}>
              Cerrar solicitud
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
