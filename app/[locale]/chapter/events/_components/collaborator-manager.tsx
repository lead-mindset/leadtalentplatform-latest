'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Users, Plus, X, Crown, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ChapterRow } from '@/lib/types'
import { getAllChapters } from '@/lib/actions/chapters'
import { addEventCollaborator, removeEventCollaborator, getEventCollaborators } from '@/lib/actions/events/event-chapter'

type Collaborator = {
  id: string
  chapter_id: string
  chapter: {
    id: string
    name: string
    university: string
  }
  addedAt: string
  addedBy: {
    id: string
    name: string
    email: string
  }
}

function isNavigationAbortLikeError(error: unknown) {
  if (!(error instanceof Error)) return false
  return /failed to fetch|network error|abort|cancel|navigation/i.test(error.message)
}

export function CollaboratorManager({
  eventId,
  ownerChapterId,
  mode,
  onCollaboratorsChange
}: {
  eventId: string
  ownerChapterId: string | null
  mode: 'create' | 'edit'
  onCollaboratorsChange?: (chapter_ids: string[]) => void
}) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [availableChapters, setAvailableChapters] = useState<ChapterRow[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    let isCancelled = false

    const loadData = async () => {
      try {
        const allChapters = await getAllChapters()
        if (isCancelled) return

        const filtered = allChapters.filter(c => c.id !== ownerChapterId)
        setAvailableChapters(filtered)

        if (mode === 'create') {
          setCollaborators([])
        } else {
          const result = await getEventCollaborators(eventId, ownerChapterId || undefined)
          if (isCancelled) return

          if ('error' in result) {
            console.error('Failed to load event collaborators:', result.error)
            setCollaborators([])
          } else {

            // Handle case where Supabase returns chapter as array or object
            const normalizedData = (result.data || [] as unknown[])
              .map((collab): Collaborator | null => {
                const collabRecord = collab as Record<string, unknown>
                const chapter = Array.isArray(collabRecord.chapter) ? (collabRecord.chapter as unknown[])[0] : collabRecord.chapter
                const addedByRecord = collabRecord.addedBy ?? collabRecord.added_by
                const addedBy = Array.isArray(addedByRecord) ? (addedByRecord as unknown[])[0] : addedByRecord

                if (!chapter || !addedBy) return null

                return {
                  id: collabRecord.id as string,
                  chapter_id: collabRecord.chapter_id as string,
                  chapter: {
                    id: (chapter as Record<string, unknown>).id as string,
                    name: (chapter as Record<string, unknown>).name as string,
                    university: (chapter as Record<string, unknown>).university as string
                  },
                  addedAt: collabRecord.added_at as string,
                  addedBy: {
                    id: (addedBy as Record<string, unknown>).id as string,
                    name: (addedBy as Record<string, unknown>).name as string,
                    email: (addedBy as Record<string, unknown>).email as string
                  },
                }
              })
              .filter((collab): collab is Collaborator => collab != null)
            setCollaborators(normalizedData)
          }
        }
      } catch (error) {
        if (!isCancelled && !isNavigationAbortLikeError(error)) {
          console.error('Failed to load chapter data:', error)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isCancelled = true
    }
  }, [eventId, mode, ownerChapterId])

  const handleAddCollaborator = () => {
    if (!selectedChapterId) return

    startTransition(async () => {
      try {
        const selectedChapter = availableChapters.find(c => c.id === selectedChapterId)
        if (!selectedChapter) return
        if (selectedChapterId === ownerChapterId) {
          toast.error('No puedes agregar el chapter propietario como colaborador')
          return
        }
        const result = await addEventCollaborator(eventId, selectedChapterId)

        if ('error' in result) {
          console.error('Failed to add collaborator:', result.error)
          toast.error(result.error)
          return
        }

        // Handle case where Supabase returns chapter as array or object
        const data = result.data as Record<string, unknown> | null
        const chapter = Array.isArray(data?.chapter) ? (data?.chapter as unknown[])[0] : data?.chapter
        const addedBy = Array.isArray(data?.added_by) ? (data?.added_by as unknown[])[0] : data?.added_by

        if (!chapter || !addedBy || !data) {
          return
        }

        const newCollaborator: Collaborator = {
          id: data.id as string,
          chapter_id: data.chapter_id as string,
          chapter: {
            id: (chapter as Record<string, unknown>).id as string,
            name: (chapter as Record<string, unknown>).name as string,
            university: (chapter as Record<string, unknown>).university as string
          },
          addedAt: data.added_at as string,
          addedBy: {
            id: (addedBy as Record<string, unknown>).id as string,
            name: (addedBy as Record<string, unknown>).name as string,
            email: (addedBy as Record<string, unknown>).email as string
          },
        }

        const updatedCollaborators = [...collaborators, newCollaborator]
        setCollaborators(updatedCollaborators)
        onCollaboratorsChange?.(updatedCollaborators.map(c => c.chapter_id))

        toast.success(`${selectedChapter.name} agregado como colaborador`)
      } catch (error) {
        console.error('Error adding collaborator:', error)
        toast.error('No se pudo agregar el colaborador')
      }
    })
  }

  const handleRemoveCollaborator = (collaborator: Collaborator) => {
    startTransition(async () => {
      try {
        // Remove collaborator using server action
        const result = await removeEventCollaborator(collaborator.id) as { error?: string } | { success: boolean }

        if ('error' in result && result.error) {
          console.error('Failed to remove collaborator:', result.error)
          toast.error(result.error)
          return
        }

        const updatedCollaborators = collaborators.filter(c => c.id !== collaborator.id)
        setCollaborators(updatedCollaborators)
        // Find the full chapter object from all chapters to add back to available chapters
        const fullChapter = availableChapters.find(c => c.id === collaborator.chapter_id)
        if (fullChapter) {
          setAvailableChapters([...availableChapters, fullChapter])
        }

        onCollaboratorsChange?.(updatedCollaborators.map(c => c.chapter_id))

        toast.success(`${collaborator.chapter.name} eliminado como colaborador`)
      } catch (error) {
        console.error('Error removing collaborator:', error)
        toast.error('No se pudo eliminar el colaborador')
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Colaboración entre chapters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Cargando configuración de colaboración...</div>
        </CardContent>
      </Card>
    )
  }

  const collaboratorCount = collaborators.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors flex-1"
            >
              <CardTitle className="text-lg">Colaboración entre chapters</CardTitle>
              {collaboratorCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {collaboratorCount} {collaboratorCount === 1 ? 'colaborador' : 'colaboradores'}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  aria-label="Ayuda sobre colaboración entre chapters"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  Agrega otros chapters como colaboradores para que sus editores puedan gestionar este evento.
                  Los colaboradores tienen acceso completo de edición.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {mode === 'edit' && ownerChapterId ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Chapter propietario</div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Crown className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">ID del chapter propietario: {ownerChapterId}</div>
                  <div className="text-sm text-muted-foreground">
                    Este chapter es responsable principal del evento
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Chapter propietario</div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Crown className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">Tu chapter</div>
                  <div className="text-sm text-muted-foreground">
                    Se asignará como propietario cuando crees el evento
                  </div>
                </div>
              </div>
            </div>
          )}

          {collaborators.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Chapters colaboradores</div>
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{collaborator.chapter.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {collaborator.chapter.university}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveCollaborator(collaborator)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Collaborator */}
          {availableChapters.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {mode === 'create' ? 'Agregar chapters colaboradores' : 'Agregar colaborador'}
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={mode === 'create' ? 'Selecciona chapters para colaborar' : 'Selecciona un chapter'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        <div>
                          <div className="font-medium">{chapter.name}</div>
                          <div className="text-sm text-muted-foreground">{chapter.university}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddCollaborator}
                  disabled={!selectedChapterId || isPending}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
              {mode === 'create' && (
                <div className="text-xs text-muted-foreground">
                  Selecciona chapters que podrán cogestionar este evento.
                </div>
              )}
            </div>
          )}

          {availableChapters.length === 0 && collaborators.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              {mode === 'create'
                ? 'No hay otros chapters disponibles para colaborar.'
                : 'No hay otros chapters disponibles para colaborar.'}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
