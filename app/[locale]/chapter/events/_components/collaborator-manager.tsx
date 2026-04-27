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
    const loadData = async () => {
      try {
        const allChapters = await getAllChapters()
        
        const filtered = allChapters.filter(c => c.id !== ownerChapterId)
        setAvailableChapters(filtered)
        
        if (mode === 'create') {
          setCollaborators([])
        } else {
          const result = await getEventCollaborators(eventId, ownerChapterId || undefined)
          
          if (result.error) {
            console.error('Failed to load event collaborators:', result.error)
            setCollaborators([])
          } else {
            // Handle case where Supabase returns chapter as array or object
            const normalizedData = (result.data || [])
              .map((collab: any): Collaborator => {
                const chapter = Array.isArray(collab.chapter) ? collab.chapter[0] : collab.chapter
const addedBy = Array.isArray(collab.addedBy) ? collab.addedBy[0] : collab.addedBy

                if (!chapter || !addedBy) return null as any

                return {
                  id: collab.id,
                  chapter_id: collab.chapter_id,
                  chapter: {
                    id: chapter.id,
                    name: chapter.name,
                    university: chapter.university
                  },
                  addedAt: collab.addedAt,
                  addedBy: {
                    id: addedBy.id,
                    name: addedBy.name,
                    email: addedBy.email
                  },
                }
              })
              .filter((collab): collab is Collaborator => collab != null)
            setCollaborators(normalizedData)
          }
        }
      } catch (error) {
        console.error('Failed to load chapter data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventId, mode, ownerChapterId])

  const handleAddCollaborator = () => {
    if (!selectedChapterId) return

    startTransition(async () => {
      try {
        const selectedChapter = availableChapters.find(c => c.id === selectedChapterId)
        if (!selectedChapter) return
        if (selectedChapterId === ownerChapterId) {
          toast.error('Cannot add the owner chapter as a collaborator')
          return
        }
        const result = await addEventCollaborator(eventId, selectedChapterId)

        if (result.error) {
          console.error('Failed to add collaborator:', result.error)
          toast.error(result.error)
          return
        }

        // Handle case where Supabase returns chapter as array or object
        const chapter = Array.isArray(result.data?.chapter) ? result.data.chapter[0] : result.data?.chapter
        const addedBy = Array.isArray(result.data?.added_by) ? result.data.added_by[0] : result.data?.added_by

          if (!chapter || !addedBy || !result.data) {
            return
          }

          const newCollaborator: Collaborator = {
            id: result.data.id,
            chapter_id: result.data.chapter_id,
            chapter: {
              id: chapter.id,
              name: chapter.name,
              university: chapter.university
            },
            addedAt: result.data.added_at,
            addedBy: {
              id: addedBy.id,
              name: addedBy.name,
              email: addedBy.email
            },
          }

          setCollaborators(prev => {
            const updated = [...prev, newCollaborator]
            onCollaboratorsChange?.(updated.map(c => c.chapter_id))
            return updated
          })
        
        toast.success(`${selectedChapter.name} added as collaborator`)
      } catch (error) {
        console.error('Error adding collaborator:', error)
        toast.error('Failed to add collaborator')
      }
    })
  }

  const handleRemoveCollaborator = (collaborator: Collaborator) => {
    startTransition(async () => {
      try {
        // Remove collaborator using server action
        const result = await removeEventCollaborator(collaborator.id)

        if (result.error) {
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
        
        toast.success(`${collaborator.chapter.name} removed as collaborator`)
      } catch (error) {
        console.error('Error removing collaborator:', error)
        toast.error('Failed to remove collaborator')
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chapter Collaboration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading collaboration settings...</div>
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
              <CardTitle className="text-lg">Chapter Collaboration</CardTitle>
              {collaboratorCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {collaboratorCount} {collaboratorCount === 1 ? 'collaborator' : 'collaborators'}
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
                  aria-label="Help with chapter collaboration"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Add other chapters as collaborators to allow their editors to manage this event.
                  Collaborators have full editing access.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 border-t pt-4">
        {mode === 'edit' && ownerChapterId ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Owner Chapter</div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Crown className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">Owner Chapter ID: {ownerChapterId}</div>
                <div className="text-sm text-muted-foreground">
                  This chapter owns the event
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Owner Chapter</div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Crown className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">Your Chapter</div>
                <div className="text-sm text-muted-foreground">
                  This will be set as the owner chapter when you create the event
                </div>
              </div>
            </div>
          </div>
        )}

        {collaborators.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Collaborating Chapters</div>
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
              {mode === 'create' ? 'Add Collaborating Chapters' : 'Add Collaborator'}
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={mode === 'create' ? "Select chapters to collaborate" : "Select a chapter to add as collaborator"} />
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
                Add
              </Button>
            </div>
            {mode === 'create' && (
              <p className="text-xs text-muted-foreground">
                Select chapters that can co-manage this event with your chapter.
              </p>
            )}
          </div>
        )}

        {availableChapters.length === 0 && collaborators.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            {mode === 'create' 
              ? 'No other chapters available to collaborate with.'
              : 'No other chapters available to collaborate with.'}
          </div>
        )}
        </CardContent>
      )}
    </Card>
  )
}
