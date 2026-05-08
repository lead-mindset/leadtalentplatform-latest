'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, RotateCcw } from 'lucide-react'
import { approveMember, rejectMember, revokeApproval } from '@/lib/actions/chapter/check-students'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

interface MemberActionButtonsProps {
  userId: string
  userName: string
  currentState: 'pending' | 'approved' | 'rejected'
}

export function MemberActionButtons({
  userId,
  userName,
  currentState
}: MemberActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
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
    setIsLoading(true)
    try {
      const result = await revokeApproval(userId)
      if (result.success) {
        toast.success(`${userName} volvio a revision pendiente`)
        router.refresh()
      } else {
        toast.error(result.error || 'No se pudo revertir la aprobacion')
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
        <div className="flex gap-2">
          <Button
            onClick={handleApprove}
            disabled={isLoading}
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
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
            className="flex-1"
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

  if (currentState === 'rejected') {
    return (
      <Button
        onClick={handleRevoke}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="mr-2 h-4 w-4" />
        )}
        Volver a revision pendiente
      </Button>
    )
  }

  return (
    <Button
      onClick={handleRevoke}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <XCircle className="mr-2 h-4 w-4" />
      )}
      Volver a revision pendiente
    </Button>
  )
}
