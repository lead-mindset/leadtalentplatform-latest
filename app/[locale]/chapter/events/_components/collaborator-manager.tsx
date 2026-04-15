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

type Collaborator = {
  id: string
  chapterId: string
  chapter: ChapterRow
  addedAt: string
  addedBy: {
    id: string
    name: string
    email: string
  }
}

export function CollaboratorManager({ eventId, ownerChapter, mode }: { eventId: string; ownerChapter: ChapterRow | null; mode: 'create' | 'edit' }) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [availableChapters, setAvailableChapters] = useState<ChapterRow[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Load real data from the Chapters table
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all chapters from the database
        const allChapters = await getAllChapters()
        
        if (mode === 'create') {
          // In create mode, show all chapters as potential collaborators
          setAvailableChapters(allChapters)
        } else {
          // Edit mode - load existing collaborators and available chapters
          // For now, we'll show all chapters except the owner (mock collaborators)
          // This would be replaced with actual EventChapter queries once the table is migrated
          const mockCollaborators: Collaborator[] = [
            // This would come from getEventCollaborators(eventId)
          ]
          setCollaborators(mockCollaborators)

          // For now, show all chapters as available (would exclude owner and existing collaborators)
          setAvailableChapters(allChapters)
        }
      } catch (error) {
        console.error('Failed to load chapter data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventId, mode])

  const handleAddCollaborator = () => {
    if (!selectedChapterId) return

    startTransition(async () => {
      // This would call addEventCollaborator(eventId, selectedChapterId)
      // For now, simulate the addition
      const selectedChapter = availableChapters.find(c => c.id === selectedChapterId)
      if (selectedChapter) {
        const newCollaborator: Collaborator = {
          id: `temp-${Date.now()}`,
          chapterId: selectedChapter.id,
          chapter: selectedChapter,
          addedAt: new Date().toISOString(),
          addedBy: {
            id: 'current-user',
            name: 'Current User',
            email: 'user@example.com',
          },
        }
        setCollaborators([...collaborators, newCollaborator])
        setAvailableChapters(availableChapters.filter(c => c.id !== selectedChapterId))
        setSelectedChapterId('')
        toast.success(`${selectedChapter.name} added as collaborator`)
      }
    })
  }

  const handleRemoveCollaborator = (collaborator: Collaborator) => {
    startTransition(async () => {
      // This would call removeEventCollaborator(eventId, collaborator.chapterId)
      // For now, simulate the removal
      setCollaborators(collaborators.filter(c => c.id !== collaborator.id))
      setAvailableChapters([...availableChapters, collaborator.chapter])
      toast.success(`${collaborator.chapter.name} removed as collaborator`)
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
        {/* Owner Chapter */}
        {mode === 'edit' && ownerChapter ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Owner Chapter</div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Crown className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">{ownerChapter.name}</div>
                <div className="text-sm text-muted-foreground">
                  {ownerChapter.university}
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

        {/* Collaborating Chapters */}
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
