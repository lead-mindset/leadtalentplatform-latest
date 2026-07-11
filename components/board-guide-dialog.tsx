'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Icons } from '@/components/ui/icons'
import { BOARD_GUIDES, BOARD_CONTACT } from '@/lib/board-guides'
import type { ChapterRoleLevel } from '@/lib/services/chapter-permission.service'

const ROLE_LABELS: Record<ChapterRoleLevel, string> = {
  president: 'Presidencia',
  vice_president: 'Vicepresidencia',
  chief_of_staff: 'Jefatura de Gabinete',
  director: 'Dirección',
  coordinator: 'Coordinación',
  member: 'Miembro',
}

function ExpandableSection({ title, content }: { title: string; content: string }) {
  return (
    <details className="group rounded-lg border border-border">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 [&::-webkit-details-marker]:hidden">
        {title}
        <Icons.ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground leading-relaxed">
        {content}
      </div>
    </details>
  )
}

function ContactTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Si tienes dudas sobre tu rol o necesitas apoyo, contacta a la organización nacional:
      </p>
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-center gap-3 text-sm">
          <Icons.Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <a href={`mailto:${BOARD_CONTACT.email}`} className="text-primary hover:underline">
            {BOARD_CONTACT.email}
          </a>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Icons.Phone className="h-4 w-4 text-muted-foreground shrink-0" />
          <a href={`tel:${BOARD_CONTACT.phone}`} className="text-primary hover:underline">
            {BOARD_CONTACT.phone}
          </a>
        </div>
      </div>
    </div>
  )
}

export function BoardGuideDialog({
  roleLevel,
  children,
}: {
  roleLevel: ChapterRoleLevel
  children: React.ReactNode
}) {
  const guide = BOARD_GUIDES[roleLevel]
  const roleLabel = ROLE_LABELS[roleLevel]

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Guía de Junta Directiva</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="tu-rol" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="tu-rol" className="flex-1">Tu rol</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
            <TabsTrigger value="faq" className="flex-1">FAQ</TabsTrigger>
            <TabsTrigger value="contacto" className="flex-1">Contacto</TabsTrigger>
          </TabsList>

          <TabsContent value="tu-rol" className="mt-4 space-y-4">
            <p className="text-sm font-medium text-primary">{roleLabel}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {guide.roleOverview}
            </p>
          </TabsContent>

          <TabsContent value="manual" className="mt-4 space-y-2">
            {guide.manual.length > 0 ? (
              guide.manual.map((item, i) => (
                <ExpandableSection key={i} title={item.title} content={item.content} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay contenido disponible para esta sección.
              </p>
            )}
          </TabsContent>

          <TabsContent value="faq" className="mt-4 space-y-2">
            {guide.faq.length > 0 ? (
              guide.faq.map((item, i) => (
                <ExpandableSection key={i} title={item.question} content={item.answer} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay preguntas frecuentes disponibles para esta sección.
              </p>
            )}
          </TabsContent>

          <TabsContent value="contacto" className="mt-4">
            <ContactTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
