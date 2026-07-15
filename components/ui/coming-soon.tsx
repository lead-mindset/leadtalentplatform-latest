'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Rocket, X, Mail } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

type ComingSoonProps = {
  children: ReactNode
  title?: string
  description?: string
  email?: string
}

export function ComingSoon({
  children,
  title = 'Esto es solo el comienzo',
  description = 'Estamos preparando algo grande para la comunidad LEAD.',
  email = 'abriones@leadmindset.org',
}: ComingSoonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  function handleDismiss() {
    const section = pathname.replace(`/${locale}`, '').split('/')[1]

    const dashboardMap: Record<string, string> = {
      chapter: `/${locale}/chapter`,
      student: `/${locale}/student`,
      admin: `/${locale}/admin`,
      company: `/${locale}/company/dashboard`,
    }

    router.replace(dashboardMap[section] ?? `/${locale}`)
  }

  return (
    <div className="relative min-h-[400px] flex-1 flex flex-col">
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-[5] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 cursor-default"
            onClick={handleDismiss}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl text-center">
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="h-6 w-6 text-primary" />
            </div>

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
      )}
    </div>
  )
}
