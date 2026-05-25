'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { approveMember, rejectMember, revokeApproval } from '@/lib/actions/chapter/check-students'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

interface MemberActionButtonsProps {
  userId: string
  userName: string
  currentState: 'pending' | 'approved'
}

export function MemberActionButtons({
  userId,
  userName,
  currentState
}: MemberActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRevokeReason, setShowRevokeReason] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const router = useRouter()

  async function handleApprove() {
    setIsLoading(true)
    try {
      const result = await approveMember(userId)
      if (result.success) {
        toast.success(`${userName} fue aprobado correctamente`)
        router.refresh()
      } else {
        toast.error(result.error || 'No se pudo aprobar al miembro')
      }
    } catch {
      toast.error('Ocurrio un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReject() {
    setIsLoading(true)
    try {
      const result = await rejectMember(userId, rejectReason || undefined)
      if (result.success) {
        toast.success(`La postulacion de ${userName} fue rechazada`)
        setShowRejectReason(false)
        setRejectReason('')
        router.refresh()
      } else {
        toast.error(result.error || 'No se pudo rechazar al miembro')
      }
    } catch {
      toast.error('Ocurrio un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRevoke() {
    const reason = revokeReason.trim()
    if (!reason) {
      toast.error('Ingresa un motivo para revocar la membresia')
      return
    }

    setIsLoading(true)
    try {
      const result = await revokeApproval(userId, reason)
      if (result.success) {
        toast.success(`${userName} ahora figura como miembro inactivo`)
        setShowRevokeReason(false)
        setRevokeReason('')
        router.refresh()
      } else {
        toast.error(result.error || 'No se pudo revocar la membresia')
      }
    } catch {
      toast.error('Ocurrio un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  if (currentState === 'pending') {
    return (
      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            onClick={handleApprove}
            disabled={isLoading}
            className="w-full min-w-0 shrink bg-success text-success-foreground hover:bg-success/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Aprobar
          </Button>
          <Button
            onClick={() => setShowRejectReason(v => !v)}
            disabled={isLoading}
            variant="destructive"
            className="w-full min-w-0 shrink"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Rechazar
          </Button>
        </div>
        {showRejectReason && (
          <div className="space-y-2">
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Nota interna opcional para editores"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Esta nota queda interna. La persona postulante puede volver a revision si se mueve a pendiente.
            </p>
            <Button
              onClick={handleReject}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirmar rechazo
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => setShowRevokeReason(v => !v)}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        <XCircle className="mr-2 h-4 w-4" />
        Revocar membresia
      </Button>
      {showRevokeReason ? (
        <div className="space-y-2">
          <Textarea
            value={revokeReason}
            onChange={(event) => setRevokeReason(event.target.value)}
            placeholder="Motivo requerido para auditoria interna"
            rows={3}
          />
          <Button
            onClick={handleRevoke}
            disabled={isLoading || revokeReason.trim().length === 0}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Confirmar revocacion
          </Button>
        </div>
      ) : null}
    </div>
  )
}
