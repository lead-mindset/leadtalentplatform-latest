'use client'

import { Copy, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  getCanonicalEventShareUrl,
  getEventShareText,
  getEventShareTitle,
} from '@/lib/events/share'

type EventShareMode = 'share' | 'copy'

type EventShareButtonProps = Omit<ButtonProps, 'children' | 'onClick'> & {
  eventId: string
  eventTitle?: string | null
  label?: string
  mode?: EventShareMode
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()

  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textArea)
  }
}

export function EventShareButton({
  eventId,
  eventTitle,
  label,
  mode = 'share',
  variant = 'outline',
  size = 'default',
  disabled,
  ...buttonProps
}: EventShareButtonProps) {
  const resolvedLabel = label ?? (mode === 'copy' ? 'Copiar enlace' : 'Compartir')
  const Icon = mode === 'copy' ? Copy : Share2

  async function copyLink(url: string) {
    await writeClipboard(url)
    toast.success('Enlace copiado')
  }

  async function handleShare() {
    const url = getCanonicalEventShareUrl(eventId, window.location.origin)

    if (mode === 'share' && navigator.share) {
      try {
        await navigator.share({
          title: getEventShareTitle(eventTitle),
          text: getEventShareText(),
          url,
        })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await copyLink(url)
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={handleShare}
      {...buttonProps}
    >
      <Icon className="h-4 w-4" />
      {resolvedLabel}
    </Button>
  )
}
