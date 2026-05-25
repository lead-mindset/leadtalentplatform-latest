'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
  FUNDING_FILE_TYPES,
  type FundingFileType,
  type FundingRequestDetail,
} from '@/lib/services/funding.service'
import {
  FUNDING_FILE_TYPE_LABELS,
  formatFundingCurrency,
} from '@/lib/funding-display'
import { updateFundingAccountability } from '@/lib/actions/funding/requests'
import {
  addFundingFileLink,
  getFundingFileAccessUrl,
  uploadFundingFile,
} from '@/lib/actions/funding/files'

export function FundingAccountabilityPanel({
  detail,
}: {
  detail: FundingRequestDetail
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const request = detail.request
  const [actualSpendAmount, setActualSpendAmount] = useState(
    request.actual_spend_amount == null ? '' : String(request.actual_spend_amount)
  )
  const [accountabilityNote, setAccountabilityNote] = useState(request.accountability_note ?? '')
  const [resultSummary, setResultSummary] = useState(request.result_summary ?? '')
  const [fileType, setFileType] = useState<FundingFileType>('receipt')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileNotes, setFileNotes] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [externalNotes, setExternalNotes] = useState('')
  const canUpdate = request.status === 'approved' || request.status === 'receipts_due'

  function saveAccountability() {
    startTransition(() => {
      void (async () => {
        const result = await updateFundingAccountability({
          requestId: request.id,
          actualSpendAmount: actualSpendAmount ? Number(actualSpendAmount) : null,
          accountabilityNote: accountabilityNote || null,
          resultSummary: resultSummary || null,
        })

        if (!result.success) {
          toast.error(result.error)
          return
        }

        toast.success('Seguimiento guardado.')
        router.refresh()
      })()
    })
  }

  function submitFile() {
    if (!file) {
      toast.error('Selecciona un archivo.')
      return
    }

    startTransition(() => {
      void (async () => {
        const formData = new FormData()
        formData.set('requestId', request.id)
        formData.set('fileType', fileType)
        formData.set('notes', fileNotes)
        formData.set('file', file)

        const result = await uploadFundingFile(formData)
        if (!result.success) {
          toast.error(result.error)
          return
        }

        toast.success('Archivo subido.')
        setFile(null)
        setFileNotes('')
        router.refresh()
      })()
    })
  }

  function submitLink() {
    startTransition(() => {
      void (async () => {
        const result = await addFundingFileLink({
          requestId: request.id,
          fileType,
          externalUrl,
          notes: externalNotes || null,
        })

        if (!result.success) {
          toast.error(result.error)
          return
        }

        toast.success('Link registrado.')
        setExternalUrl('')
        setExternalNotes('')
        router.refresh()
      })()
    })
  }

  function openFile(fileId: string) {
    startTransition(() => {
      void (async () => {
        const result = await getFundingFileAccessUrl({ fileId })
        if (!result.success) {
          toast.error(result.error)
          return
        }

        window.open(result.url, '_blank', 'noopener,noreferrer')
      })()
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Seguimiento post-evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
            <div className="space-y-2">
              <Label htmlFor="actual-spend">Gasto real</Label>
              <Input
                id="actual-spend"
                inputMode="decimal"
                value={actualSpendAmount}
                onChange={(event) => setActualSpendAmount(event.target.value)}
                disabled={!canUpdate || isPending}
                placeholder="0.00"
              />
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Aprobado</p>
              <p className="text-base font-semibold">
                {request.approved_amount == null ? 'Pendiente' : formatFundingCurrency(request.approved_amount, request.currency)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="result-summary">Resultado e impacto</Label>
            <Textarea
              id="result-summary"
              rows={4}
              value={resultSummary}
              onChange={(event) => setResultSummary(event.target.value)}
              disabled={!canUpdate || isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountability-note">Notas de comprobantes</Label>
            <Textarea
              id="accountability-note"
              rows={3}
              value={accountabilityNote}
              onChange={(event) => setAccountabilityNote(event.target.value)}
              disabled={!canUpdate || isPending}
            />
          </div>

          <Button type="button" className="w-full" onClick={saveAccountability} disabled={!canUpdate || isPending}>
            Guardar seguimiento
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comprobantes y evidencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="file-type">Tipo</Label>
              <Select value={fileType} onValueChange={(value) => setFileType(value as FundingFileType)}>
                <SelectTrigger id="file-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_FILE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{FUNDING_FILE_TYPE_LABELS[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="funding-file">Archivo</Label>
              <Input
                ref={fileInputRef}
                id="funding-file"
                type="file"
                className="sr-only"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                disabled={!canUpdate || isPending}
              />
              <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canUpdate || isPending}
                >
                  <Icons.Upload className="mr-2 h-4 w-4" />
                  Seleccionar archivo
                </Button>
                <p className="min-w-0 truncate text-sm text-muted-foreground">
                  {file ? file.name : 'PDF o imagen, hasta 10 MB'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-notes">Notas del archivo</Label>
            <Input
              id="file-notes"
              value={fileNotes}
              onChange={(event) => setFileNotes(event.target.value)}
              disabled={!canUpdate || isPending}
            />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={submitFile} disabled={!canUpdate || isPending}>
            <Icons.Upload className="mr-2 h-4 w-4" />
            Subir archivo
          </Button>

          <div className="grid gap-4 border-t pt-5 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="external-url">Link externo</Label>
              <Input
                id="external-url"
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
                disabled={!canUpdate || isPending}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={submitLink} disabled={!canUpdate || isPending || !externalUrl}>
                Registrar link
              </Button>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="external-notes">Notas del link</Label>
              <Input
                id="external-notes"
                value={externalNotes}
                onChange={(event) => setExternalNotes(event.target.value)}
                disabled={!canUpdate || isPending}
              />
            </div>
          </div>

          <div className="space-y-3">
            {detail.files.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Todavía no hay comprobantes ni evidencia registrados.
              </p>
            ) : (
              detail.files.map(item => (
                <div key={item.id} className="flex flex-col gap-3 rounded-md border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{FUNDING_FILE_TYPE_LABELS[item.file_type as FundingFileType]}</Badge>
                      <p className="truncate text-sm font-medium">{item.original_name ?? item.external_url ?? 'Link externo'}</p>
                    </div>
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => openFile(item.id)} disabled={isPending}>
                    <Icons.ExternalLink className="mr-2 h-4 w-4" />
                    Abrir
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
