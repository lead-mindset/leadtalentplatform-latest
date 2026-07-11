'use client'

import { useTransition } from 'react'
import { useRouter } from '@/i18n/routing'
import { toast } from 'sonner'
import { Loader2, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptChapterInvite } from '@/lib/actions/chapter/invite-acceptance'

type Props = {
  token: string
}

export function AcceptInviteClient({ token }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function acceptInvite() {
    startTransition(async () => {
      const result = await acceptChapterInvite({ token })
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('¡Rol activado! Bienvenido/a al equipo.')
      router.push('/chapter')
      router.refresh()
    })
  }

  return (
    <Button onClick={acceptInvite} disabled={isPending} size="lg" className="w-full sm:w-auto">
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <PartyPopper className="mr-2 h-4 w-4" />
      )}
      {isPending ? 'Activando...' : '¡Aceptar y activar mi rol!'}
    </Button>
  )
}
