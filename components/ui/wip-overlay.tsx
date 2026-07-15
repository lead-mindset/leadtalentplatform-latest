'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Mail } from 'lucide-react'

type WipOverlayProps = {
  children: ReactNode
  title?: string
  description?: string
  email?: string
}

export function WipOverlay({
  children,
  title = 'Esto es solo el comienzo',
  description = 'Estamos preparando algo grande para la comunidad LEAD. Esta funcionalidad esta en construccion y muy pronto la tendras disponible. Mientras tanto, queremos escucharte: tu feedback es clave para que esto quede increible.',
  email = 'abriones@leadmindset.org',
}: WipOverlayProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="relative min-h-[400px] flex-1 flex flex-col">
      {children}

      <div className="fixed inset-0 z-[5] bg-background/60 p-4 sm:p-6">
        <div className="flex min-h-full items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl text-center">
            <p className="font-headline text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
              {title}
            </p>

            <p className="mx-auto mb-6 max-w-sm whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>

            <a
              href={`mailto:${email}`}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
            >
              <Mail className="h-4 w-4" />
              Quiero colaborar / Enviar feedback
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
